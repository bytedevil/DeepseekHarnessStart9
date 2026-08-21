// Constants and helper functions shared across this package's startos/ code.
export const uiPort = 8080 // health endpoint of the native-API agent
export const webPort = 4200 // dsh web (loopback-only inside the container)
export const proxyPort = 4201 // TCP forwarder exposed to StartOS (0.0.0.0)
