import path from 'path'
import { exec, spawn } from 'node:child_process'
import { SpawnOptions } from 'child_process'
import util from 'node:util'

import { FfprobeData } from '../types/ffprobedata'

const execAsync = util.promisify(exec)

export const getVideoInfo = async (inVideo: string) => {
  const args = [
    'ffprobe',
    '-print_format json',
    '-hide_banner',
    '-show_error',
    '-show_format',
    '-show_streams',
    `"${inVideo}"`,
  ]

  const cmd = args.join(' ')
  const { stdout } = await execAsync(cmd)
  const probe: FfprobeData = JSON.parse(stdout)
  if (!probe.streams || probe.streams.length === 0) {
    throw new Error('Unable to get video details')
  }

  const metadata = {
    fps: 24,
    width: 858,
    height: 480,
    duration: 60,
    framescount: 24 * 60,
    hasvideo: true,
    hasaudio: false,
    codec: 'h264',
    pixformat: '',
    audiocodec: '',
    name: '',
  }

  const audiostream = probe.streams.find(
    (stream) => stream.codec_type === 'audio'
  )
  metadata.hasaudio = !!audiostream

  const videostream =
    probe.streams.find((stream) => stream.codec_type === 'video') ||
    probe.streams[0]
  metadata.hasvideo = !!videostream

  if (metadata.hasvideo) {
    metadata.duration = Number(videostream.duration)
    metadata.width = videostream.width!
    metadata.height = videostream.height!
    metadata.codec = videostream.codec_name!
    const fpsFraction = videostream.avg_frame_rate!.split('/')
    metadata.fps = Number(fpsFraction[0]) / Number(fpsFraction[1])
    metadata.framescount = Number(videostream.nb_frames)
    metadata.pixformat = videostream.pix_fmt!
    metadata.name = path.basename(probe.format.filename!)

    if (!metadata.duration && probe.format && probe.format.duration) {
      metadata.duration = Math.round(probe.format.duration)
    }

    if (!metadata.framescount) {
      metadata.framescount = Math.round(metadata.duration * metadata.fps)
    }
  }

  if (metadata.hasaudio && audiostream) {
    metadata.audiocodec = audiostream.codec_name!
  }

  return metadata
}

export const generateH264Video = (
  inVideo: string,
  outVideo: string,
  hasAudio: boolean,
  progressFile: string
) => {
  let audioArgs: string[] = []
  if (hasAudio) {
    audioArgs = ['-acodec', 'aac', '-strict', 'experimental']
  }

  const args = [
    '-y',
    '-hide_banner',
    '-loglevel',
    'warning',
    '-i',
    `"${inVideo}"`,
    '-vcodec',
    'libx264',
    '-crf',
    '18',
    '-strict',
    '-2',
    '-preset',
    'veryfast',
    ...audioArgs,
    '-progress',
    `"${progressFile}"`,
    `"${outVideo}"`,
  ]

  return spawn('ffmpeg', args, { shell: true })
}
