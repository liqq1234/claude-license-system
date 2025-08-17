/**
 * 生产环境日志管理工具
 * 在生产环境中禁用所有 console 输出
 */

// 检查是否启用控制台输出
const isConsoleEnabled = import.meta.env.MODE === 'development' ||
                        import.meta.env.DEV ||
                        import.meta.env.VITE_ENABLE_CONSOLE === 'true'

// 创建日志对象
const logger = {
  log: isConsoleEnabled ? console.log.bind(console) : () => {},
  warn: isConsoleEnabled ? console.warn.bind(console) : () => {},
  error: isConsoleEnabled ? console.error.bind(console) : () => {},
  info: isConsoleEnabled ? console.info.bind(console) : () => {},
  debug: isConsoleEnabled ? console.debug.bind(console) : () => {},
  trace: isConsoleEnabled ? console.trace.bind(console) : () => {},
  group: isConsoleEnabled ? console.group.bind(console) : () => {},
  groupEnd: isConsoleEnabled ? console.groupEnd.bind(console) : () => {},
  table: isConsoleEnabled ? console.table.bind(console) : () => {},
  time: isConsoleEnabled ? console.time.bind(console) : () => {},
  timeEnd: isConsoleEnabled ? console.timeEnd.bind(console) : () => {}
}

export default logger
