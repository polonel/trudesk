import React, { useCallback } from 'react'
import { Handle, Position } from 'reactflow'
import './customNodeOne.sass'

const handleStyle = {}

const CustomNodeOne = ({ data }) => {
  const onChange = useCallback(evt => {
    console.log(evt.target.value)
    if (data && data.run && typeof data.run === 'function') data.run()
  }, [])

  return (
    <div className={'custom-node-one'}>
      <Handle type='target' position={Position.Top} />
      <div>
        <label htmlFor='text'>Text:</label>
        <input id='text' name='text' onChange={onChange} className='nodrag' />
      </div>
      <Handle type='source' position={Position.Bottom} id='a' />
      <Handle type='source' position={Position.Left} id='b' style={handleStyle} />
    </div>
  )
}

export default CustomNodeOne
