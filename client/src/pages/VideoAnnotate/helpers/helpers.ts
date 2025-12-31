export const toHHMMSS = (sec: number) => {
  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec - hours * 3600) / 60)
  const seconds = sec - hours * 3600 - minutes * 60

  let hoursStr = hours.toString()
  if (hours < 10) {
    hoursStr = '0' + hours
  }

  let minutesStr = minutes.toString()
  if (minutes < 10) {
    minutesStr = '0' + minutes
  }

  const fixedSeconds = seconds.toFixed(0)
  let secondsStr = fixedSeconds
  if (Number(fixedSeconds) < 10) {
    secondsStr = '0' + fixedSeconds
  }

  return `${hoursStr}:${minutesStr}:${secondsStr}`
}

const wrap = (val: number) => {
  if (val < 10) {
    return `0${val.toFixed(0)}`
  }

  return val.toFixed(0)
}

export const toHHMMSSFromFPS = (sec: number, frame: number, fps: number) => {
  if (frame === 0) {
    return '0:00:00.01'
  }

  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = Math.floor((sec % 3600) % 60)
  const ff = Math.floor(frame % fps) || Number(fps)
  const hhmmss = `${hours}:${wrap(minutes)}:${wrap(seconds)}.${wrap(ff)}`
  return hhmmss
}

export const calculateFrame = (sec: number, fps: number) => {
  return Math.round(sec * fps)
}
