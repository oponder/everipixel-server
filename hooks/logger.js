const logger = require('loglevel');

logger.setLevel('info');

module.exports = function log (hook) {
  let message = `${hook.type}: ${hook.path} - Method: ${hook.method}`

  if (hook.type === 'error') {
    message += `: ${hook.error.message}`
  }

  logger.debug(message)

  if (hook.error) {
    logger.error('error', hook.error)
  }

  if (hook.data) {
    logger.trace('data', hook.data)
  }

  if (hook.params) {
    logger.trace('params', hook.params)
  }

  if (hook.result) {
    logger.trace(hook.result)
  }
}
