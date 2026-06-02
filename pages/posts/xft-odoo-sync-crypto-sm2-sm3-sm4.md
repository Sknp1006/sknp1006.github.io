---
title: 薪福通与 Odoo 19 同步实战（二）：国密 SM2/SM3/SM4 全链路加解密
date: 2026-06-02 11:00:00
updated: 2026-06-02 11:00:00
tags: [国密, SM2, SM3, SM4, gmssl, 薪福通, Python]
categories:
  - 牛排的小项目
---

薪福通是招商银行的薪税人事平台，开放 API 的鉴权方案基于国密算法——SM4 做报文加解密、SM3 做摘要、SM2 做签名。中文技术社区里关于这三件套的实战文章非常少，官方文档给了流程和示例但散落各处，拼起来花了我不少时间。

这篇把 `hr_xft_sync` 模块里对接薪福通 API 的加解密全链路拆开讲，从密钥派生到请求构造到响应解密，每一步都带上代码和对应的坑。

<!-- more -->

> 本文是薪福通与 Odoo 19 同步系列的第二篇，模块架构和职位映射分别在前后篇。

## 1. 整体鉴权流程

一次薪福通 API 调用的加解密流程可以概括为：

```text
原始 JSON
    ↓ SM4 ECB 加密（密钥 = AuthoritySecret 前 32 位 hex）
加密 hex 字符串
    ↓ 包装为 {"secretMsg": "加密hex"}
    ↓ JSON 序列化
实际请求体
    ↓ SM3 摘要
x-alb-digest

签名串 = "POST <path>?<query>\nx-alb-digest: <digest>\nx-alb-timestamp: <timestamp>"
    ↓ SM2 签名（私钥 = AuthoritySecret）
apisign

最终 Header: appid, x-alb-digest, x-alb-timestamp, apisign, x-alb-verify=sm3withsm2
```

三个国密算法各管一件事：

| 算法 | 用途 | 密钥来源 |
|------|------|---------|
| SM4 | 报文加解密 | AuthoritySecret 的前 32 个 hex 字符（16 字节） |
| SM3 | 请求体摘要 | 无密钥，纯哈希 |
| SM2 | 请求签名 | AuthoritySecret 作为私钥 |

一个容易搞混的点：**SM4 加密用的不是完整密钥，而是前 32 位 hex**。如果用了完整密钥去做 SM4，接口会返回解密失败。

## 2. 密钥校验与派生

`AuthoritySecret` 是一个偶数长度的十六进制字符串。模块在每次使用前做格式校验：

```python
def _get_authority_secret(self):
    authority_secret = (self.xft_app_secret or "").strip().lower()
    if not authority_secret:
        raise UserError(_("请先维护薪福通应用密钥。"))
    if len(authority_secret) < 32 or len(authority_secret) % 2 != 0:
        raise UserError(_("薪福通应用密钥格式不正确，需为偶数长度的十六进制字符串。"))
    try:
        bytes.fromhex(authority_secret)
    except ValueError as exc:
        raise UserError(_("薪福通应用密钥格式不正确，需为十六进制字符串。")) from exc
    return authority_secret
```

SM4 密钥取前 32 个 hex 字符：

```python
def _get_sm4_key(self):
    return bytes.fromhex(self._get_authority_secret()[:32])
```

## 3. gmssl 库的集成

Python 生态里做国密最成熟的库是 `gmssl`，模块通过动态 import 引入：

```python
def _get_gmssl_module(self, module_name):
    try:
        return import_module("gmssl.%s" % module_name)
    except ImportError as exc:
        raise UserError(_("未安装薪福通国密依赖 gmssl，请先在 odoo-venv 中安装。")) from exc
```

用 `importlib.import_module` 而不是顶层 import，是为了在 gmssl 未安装时不阻断 Odoo 模块加载——只在实际调用接口时才报错，这样不会因为缺少依赖就导致整个 Odoo 起不来。

## 4. SM4 报文加解密

### 4.1 加密（请求体）

SM4 采用 ECB 模式，对原始 JSON 请求体加密：

```python
def _sm4_encrypt_text(self, plaintext):
    sm4 = self._get_gmssl_module("sm4")
    cryptor = sm4.CryptSM4()
    cryptor.set_key(self._get_sm4_key(), sm4.SM4_ENCRYPT)
    return cryptor.crypt_ecb(plaintext.encode("utf-8")).hex()
```

输入是 UTF-8 编码的 JSON 字符串，输出是十六进制字符串。

### 4.2 解密（响应体）

```python
def _sm4_decrypt_text(self, ciphertext):
    sm4 = self._get_gmssl_module("sm4")
    cryptor = sm4.CryptSM4()
    cryptor.set_key(self._get_sm4_key(), sm4.SM4_DECRYPT)
    decrypted = cryptor.crypt_ecb(bytes.fromhex(ciphertext))
    return decrypted.decode("utf-8")
```

加解密用的是同一个密钥，只是方向不同（`SM4_ENCRYPT` vs `SM4_DECRYPT`）。

### 4.3 请求体包装

加密后的 hex 字符串包装在 `secretMsg` 字段里发送：

```python
def _build_signed_post_request(self, payload):
    body_plaintext = self._json_dumps(payload)
    encrypted_body = self._sm4_encrypt_text(body_plaintext)
    request_body = self._json_dumps({"secretMsg": encrypted_body})
    # ...
```

注意 JSON 序列化用了 `ensure_ascii=False, separators=(",", ":")`——去掉多余空格，确保摘要计算和实际发送的字节完全一致。

## 5. SM3 摘要

SM3 对**实际发送的请求体**（包装了 `secretMsg` 之后的 JSON）做哈希：

```python
def _sm3_digest(self, text):
    sm3 = self._get_gmssl_module("sm3")
    return sm3.sm3_hash(list(text.encode("utf-8")))
```

`gmssl` 的 `sm3_hash` 接受的参数是字节列表（`list(bytes)`），所以需要先把字符串编码为 UTF-8 字节，再转为列表。

摘要结果放入 header 的 `x-alb-digest`。这一步最容易踩的坑是：**摘要的对象是包装后的 `{"secretMsg": "..."}` 而不是原始 JSON**。如果先算摘要再加密，服务端会校验失败。

## 6. SM2 签名

### 6.1 构造 SM2 签名器

```python
def _get_sm2_cryptor(self):
    sm2 = self._get_gmssl_module("sm2")
    private_key = self._get_authority_secret()
    signer = sm2.CryptSM2(private_key=private_key, public_key="", asn1=False)
    # 从私钥推导公钥
    public_key = signer._kg(int(private_key, 16), signer.ecc_table["g"])
    return sm2.CryptSM2(private_key=private_key, public_key=public_key, asn1=False)
```

这里有个细节：`gmssl` 的 `CryptSM2` 构造时需要同时提供公钥和私钥，但我们只有私钥（AuthoritySecret）。解决办法是先用一个空公钥创建实例，然后通过椭圆曲线乘法 `_kg` 从私钥推导出公钥，再用完整参数创建新的实例。

`asn1=False` 表示签名输出原始格式而不是 ASN.1 DER 编码——薪福通要求的是原始格式。

### 6.2 构造签名串

签名串的规则是固定的三段式：

```text
POST <path>?<query>
x-alb-digest: <digest>
x-alb-timestamp: <timestamp>
```

注意几个要点：

- **path 带 query string**，不是完整 URL
- `x-alb-digest` 的值是**实际发送的 body 字符串**（不是原始 JSON）
- `x-alb-timestamp` 是**秒级时间戳**，而 query 里的 `CSCREQTIM` 是**毫秒级**——搞混了签名校验不过

```python
def _build_signed_post_request(self, payload):
    # ... 前面已经加密和算摘要
    timestamp = str(int(time.time()))
    base_url = (self.xft_api_base_url or "").rstrip("/")
    endpoint = self.xft_roster_endpoint or ""
    query_string = urlencode(self._build_query_pairs())
    path_with_query = "%s?%s" % (endpoint, query_string)

    sign_str = "POST %s\nx-alb-digest: %s\nx-alb-timestamp: %s" % (
        path_with_query, request_body, timestamp
    )
    apisign = self._get_sm2_cryptor().sign_with_sm3(sign_str.encode("utf-8"))
```

### 6.3 Query 参数构造

Query string 里的公共参数：

```python
def _build_query_pairs(self):
    request_millis = str(int(time.time() * 1000))
    query_pairs = [
        ("CSCAPPUID", self.xft_app_id),
        ("CSCREQTIM", request_millis),          # 毫秒级时间戳
        ("CSCUSRNBR", self.xft_user_number),     # 企业用户号
        ("CSCUSRUID", self.xft_user_uid),        # 平台用户号
    ]
    if self.xft_project_code:
        query_pairs.insert(1, ("CSCPRJCOD", self.xft_project_code))
    return query_pairs
```

`CSCPRJCOD`（企业号）是可选的，有值时插入到第二个位置。参数顺序不影响签名——签名用的是 path + query，不是 query 参数本身。

## 7. 完整请求构造

把上面的步骤串起来，一次完整的请求构造：

```python
def _build_signed_post_request(self, payload):
    self.ensure_one()
    body_plaintext = self._json_dumps(payload)          # 原始 JSON
    encrypted_body = self._sm4_encrypt_text(body_plaintext)  # SM4 加密
    request_body = self._json_dumps({"secretMsg": encrypted_body})  # 包装
    digest = self._sm3_digest(request_body)             # SM3 摘要
    timestamp = str(int(time.time()))                   # 秒级时间戳

    base_url = (self.xft_api_base_url or "").rstrip("/")
    endpoint = self.xft_roster_endpoint or ""
    query_string = urlencode(self._build_query_pairs())
    path_with_query = "%s?%s" % (endpoint, query_string)
    full_url = "%s%s" % (base_url, path_with_query)

    # 签名串
    sign_str = "POST %s\nx-alb-digest: %s\nx-alb-timestamp: %s" % (
        path_with_query, request_body, timestamp
    )
    apisign = self._get_sm2_cryptor().sign_with_sm3(sign_str.encode("utf-8"))

    headers = {
        "appid": self.xft_app_id,
        "x-alb-digest": digest,
        "x-alb-timestamp": timestamp,
        "apisign": apisign,
        "x-alb-verify": "sm3withsm2",
        "Content-Type": "application/json",
    }
    return full_url, headers, request_body
```

最终发出的 HTTP 请求长这样：

```bash
POST "https://api.cmbchina.com/hrm/.../staffInfo?CSCAPPUID=xxx&CSCREQTIM=xxx&..."
Header:
  appid: <app_id>
  x-alb-digest: <sm3_hex>
  x-alb-timestamp: <seconds>
  apisign: <sm2_sign_hex>
  x-alb-verify: sm3withsm2
  Content-Type: application/json
Body:
  {"secretMsg": "<sm4_encrypted_hex>"}
```

## 8. 响应解密

薪福通的响应可能有多种格式，`_decode_xft_response()` 做了多层兼容：

```python
def _decode_xft_response(self, response):
    response_text = (response.text or "").strip()

    # 1. 先尝试 JSON 解析
    try:
        payload = response.json()
    except ValueError:
        payload = None

    # 2. 如果 JSON 里有 secretMsg，SM4 解密
    if isinstance(payload, dict) and payload.get("secretMsg"):
        decrypted_text = self._sm4_decrypt_text(payload["secretMsg"])
        return json.loads(decrypted_text)

    # 3. 如果已经是明文 JSON，直接返回
    if isinstance(payload, (dict, list)):
        return payload

    # 4. 兜底：尝试 SM4 解密整个响应文本
    try:
        decrypted_text = self._sm4_decrypt_text(response_text)
        return json.loads(decrypted_text)
    except Exception as exc:
        raise UserError(_("薪福通响应解析失败：%s") % response_text[:200]) from exc
```

正常流程是第 2 步：响应里带了 `secretMsg`，解密后得到业务 JSON。

## 9. 错误处理

薪福通的错误返回有两种结构：

### 9.1 HTTP 层错误

```python
def _raise_xft_http_error(self, response):
    status_code = response.status_code
    detail = (response.text or "").strip()

    # 尝试解析错误详情
    try:
        payload = self._decode_xft_response(response)
    except Exception:
        payload = None

    hint = ""
    if status_code == 403:
        hint = "；请重点检查接口权限、企业号CSCPRJCOD以及服务端IP白名单"
    elif status_code == 401:
        hint = "；请重点检查appid、AuthoritySecret和签名串"

    raise UserError(_("薪福通接口HTTP失败：%s，响应：%s%s") % (
        status_code, detail[:500], hint
    ))
```

加了 HTTP 状态码对应的人工排查提示，403 和 401 是最常见的两种鉴权失败。

### 9.2 业务层错误

薪福通的业务错误有两种结构：

```python
# 结构一：SYCOMRETZ（银行系统级错误）
sycom_errors = payload.get("SYCOMRETZ")
if isinstance(sycom_errors, list) and sycom_errors:
    error_msg = first_error.get("ERRMSG")
    error_code = first_error.get("ERRCOD")
    raise UserError(_("薪福通接口返回失败：%s（%s）") % (error_msg, error_code))

# 结构二：returnCode（应用级错误）
return_code = payload.get("returnCode")
if return_code and return_code != "SUC0000":
    error_msg = payload.get("errorMsg")
    raise UserError(_("薪福通接口返回失败：%s（%s）") % (error_msg, return_code))
```

实测中遇到的一个典型案例：接口权限开通后返回 200，但应用状态异常时薪福通返回了 `SYCOMRETZ` 结构，错误码 `SYOPA16`——"应用状态错误"。模块直接提取 `ERRMSG` 展示给管理员，排查时一眼就能看到问题。

## 10. 联调排查清单

根据踩坑经验总结的排查顺序：

| # | 检查项 | 常见错误 |
|---|--------|---------|
| 1 | `appid` 与 `CSCAPPUID` 是否一致 | 复制粘贴时漏了字符 |
| 2 | `x-alb-timestamp` 是秒级，`CSCREQTIM` 是毫秒级 | 搞反了签名校验不过 |
| 3 | 签名串是否包含完整 path + query | 漏了某个 query 参数 |
| 4 | `x-alb-digest` 是否基于包装后的 body 计算 | 对原始 JSON 算了摘要 |
| 5 | SM4 密钥是否只取了前 32 位 hex | 用了完整密钥做加密 |
| 6 | 沙盒与生产的企业号是否混用 | 测试环境企业号 != 生产环境 |
| 7 | JSON 序列化是否去掉了空格 | `json.dumps` 默认有空格 |
| 8 | SM2 签名是否用了 `asn1=False` | 默认 ASN.1 编码，薪福通不认 |

## 11. 小结

整个加解密链路的核心就三句话：

1. **请求体**：原始 JSON → SM4 加密 → 包装 `secretMsg` → 作为实际 body 发送
2. **摘要**：对实际 body 做 SM3 → 放入 `x-alb-digest`
3. **签名**：拼接 `POST path?query\nx-alb-digest: body\nx-alb-timestamp: ts` → SM2 签名 → 放入 `apisign`

对接薪福通最折腾的地方不在业务逻辑，而在这些加解密细节。官方文档虽然有 SDK 和鉴权模拟器，但 Python 侧的实战参考几乎为零。希望这篇能帮到后续对接薪福通的开发者。

下一篇讲 Excel 职位映射导入和部门自动维护——这两个功能看起来简单，但在员工数据治理里扮演的角色很关键。
