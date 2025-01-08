// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css'],
  modules: ['@invictus.codes/nuxt-vuetify'],

  app: {
    head: {
      title: 'Vartur Task',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Vartur Task - Categories and Products Management' },
      ],
    },
  },

  compatibilityDate: '2025-01-08',
});