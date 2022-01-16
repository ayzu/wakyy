export function parseHours(input: string) {
  const num = parseInt(input)
  if (isNaN(num) || num < 0 || num > 23) {
    throw 'hours must be in range [0, 23]:' + input
  }
  return num
}

export function parseMinutes(input: string) {
  const num = parseInt(input)
  if (isNaN(num) || num < 0 || num > 59) {
    throw 'minutes must be in range [0, 23]:' + input
  }
  return num
}

export function parseTimestamp(input: string) {
  const data = input.replace(':', '')
  let hours, minutes

  if (data.length == 4) {
    // 1000
    hours = data.slice(0, 2)
    minutes = data.slice(2)
  } else if (data.length == 3) {
    // 900
    hours = data.slice(0, 1)
    minutes = data.slice(1)
  } else {
    throw 'unrecognised timestamp format: ' + input
  }

  return [parseHours(hours), parseMinutes(minutes)]
}

export function timestampToStr(hours: number, minutes: number) {
  return `${hours}:${String(minutes).padStart(2, '0')}`
}
