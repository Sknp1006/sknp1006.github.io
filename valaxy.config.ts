import { defineValaxyConfig } from 'valaxy'
import type { UserThemeConfig } from 'valaxy-theme-yun'
import { addonWaline } from 'valaxy-addon-waline'

import { addonAlgolia } from 'valaxy-addon-algolia'
import { addonComponents } from 'valaxy-addon-components'

// add icons what you will need
const safelist = [
  'i-ri-home-line',
]

/**
 * User Config
 */
export default defineValaxyConfig<UserThemeConfig>({
  // site config see site.config.ts

  theme: 'yun',

  themeConfig: {
    banner: {
      enable: true,
      title: '焼烤牛排的小站',
      cloud: {
        enable: true,
      },
    },

    pages: [
      {
        name: '我的小伙伴们',
        url: '/links/',
        icon: 'i-ri-links-line',
        color: 'dodgerblue',
      },
      // {
      //   name: '我的图床',
      //   url: 'https://images.sknp.top/',
      //   icon: 'i-ri-cloud-line',
      //   color: '#FA8072',
      // },
    ],

    footer: {
      since: 2020,
      beian: {
        enable: false,
        icp: '粤ICP备2023009426号',
      },
    },
  },

  unocss: { safelist },

  addons: [
    addonComponents(),
    addonWaline({
      serverURL: 'https://waline.sknp.top',
      locale: {
        placeholder: '填写邮箱或点击登陆，让我们保持联系～'
      },
      comment: true,
      pageview: true,
    }),
  ],
})
