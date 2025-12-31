import { FC } from 'react'
import useImage from 'use-image'
import { Circle, Group, Image } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'

import ChatIcon from '../assets/chat.png'

type KonvaChatProps = { x: number; y: number; onClick: () => void }
const KonvaChat: FC<KonvaChatProps> = ({ x, y, onClick }) => {
  const [chatPng] = useImage(ChatIcon, 'anonymous', 'origin')

  const onCommentClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onClick()
  }

  return (
    <Group onClick={onCommentClick} x={x} y={y}>
      <Circle fill="white" x={0} y={0} radius={10} />
      <Image image={chatPng} x={-6} y={-6} height={12} width={12} />
    </Group>
  )
}

export default KonvaChat
