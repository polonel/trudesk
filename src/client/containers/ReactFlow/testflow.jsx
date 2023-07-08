import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, useStore } from 'reactflow'
import 'reactflow/dist/style.css'
import PageContent from 'components/PageContent'
import CustomNodeOne from './CustomNodeOne'
import PageTitle from 'components/PageTitle'
import Button from 'components/Button'

const initialNodes = [
  {
    id: '1',
    data: {
      label: 'Hello'
    },
    position: { x: 50, y: 50 },
    type: 'customNodeOne'
  },
  {
    id: '2',
    position: { x: 150, y: 150 },
    data: { label: 'World' }
  }
]
// const initialEdges = [{ id: '1-2', source: '1', target: '2', type: 'step' }]
const initialEdges = []

const nodeTypes = { customNodeOne: CustomNodeOne }

const TestFlow = props => {
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)

  const onNodeChange = useCallback(changes => setNodes(nds => applyNodeChanges(changes, nds)), [])
  const onEdgeChange = useCallback(changes => setEdges(eds => applyEdgeChanges(changes, eds)), [])
  const onConnect = useCallback(params => setEdges(eds => addEdge(params, eds)), [])

  const onClick = () => {
    let eventNode = nodes.find(n => n.type === 'customNodeOne')
    if (eventNode < 1) return
    eventNode = eventNode[0]

    const target = edges.find(ed => ed.source === '1' && ed.sourceHandle === 'a')?.target
    if (target) {
      const targetNode = nodes.find(n => n.id === target)
      console.log(targetNode)
    }
  }

  return (
    <PageContent padding={0} paddingBottom={0}>
      <PageTitle title={'Flow'} rightComponent={<Button text={'Run'} onClick={e => onClick(e)} />}></PageTitle>
      <div className={'full-height'}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          proOptions={{ hideAttribution: true }}
          onNodesChange={onNodeChange}
          onEdgesChange={onEdgeChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </PageContent>
  )
}

TestFlow.propTypes = {}

export default TestFlow
