import * as Sentry from "@sentry/node"
import * as Tracing from "@sentry/tracing"
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

import { api } from './api/server'

i18next.use(Backend).init({
    lng: 'en',
    fallbackLng: 'en',
    preload: ['en'],
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
        // path where resources get loaded from, or a function
        // returning a path:
        // function(lngs, namespaces) { return customPath; }
        // the returned path will interpolate lng, ns if provided like giving a static path
        loadPath: 'src/locales/{{lng}}/{{ns}}.json',

        // path to post missing resources
        addPath: 'src/locales/{{lng}}/{{ns}}.missing.json'
    },
    debug: true,
})

// specify lang ex:
// t('welcome', { lng: 'en' })

Sentry.init({
    dsn: "",

    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express(),
    ],

    // clean any possibly present sensitive user data
    beforeSend(event) {
        // if user
        if (event.user) {
            // scrub any possible sensitive data

            // don't send email address
            delete event.user.email;
            // don't send username
            delete event.user.username;
            // don't send ip address
            delete event.user.ip_address;
        }
        return event;
    },

    tracesSampler: (samplingContext) => {
        switch (samplingContext.transactionContext.op) {
            case 'start api':
                return 1;
            case 'shutdown':
                return 1;
            default:
                return 0.5;
        }
    },
});

const startServer = Sentry.startTransaction({
    op: "start api",
    name: "Started the api server",
});

try {
    const server = new api(3420, 'INSTANCE001')
} catch (error) {
    Sentry.captureException(error);
} finally {
    startServer.finish()
}