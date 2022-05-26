import React, { useEffect, useState } from 'react'
import { Grid, Card, Statistic } from 'semantic-ui-react'
import './nft.css'
import { useSubstrateState } from '../substrate-lib'
import { TxButton } from '../substrate-lib/components'

function Main(props) {
  const { api } = useSubstrateState()

  // The transaction submission status
  const [status, setStatus] = useState('')

  // The currently stored value
  const [nextTokenId, setNextTokenId] = useState(0)
  //const [formValue, setFormValue] = useState(0)

  useEffect(() => {
    let unsubscribe
    api.query.marketplace
      .nextTokenId(newValue => {
        // The storage value is an Option<u32>
        // So we have to check whether it is None first
        // There is also unwrapOr
        if (newValue.isNone) {
          setNextTokenId('<None>')
        } else {
          setNextTokenId(newValue.unwrap().toNumber())
        }
      })
      .then(unsub => {
        unsubscribe = unsub
      })
      .catch(console.error)

    return () => unsubscribe && unsubscribe()
  }, [api.query.marketplace])

  return (
    <Grid.Column width={8}>
      <h1>Mint NFTs</h1>
      <Card centered>
        <Card.Content textAlign="center">
          <Statistic label="Number of NFTs Minted" value={nextTokenId} />
        </Card.Content>
      </Card>
      <div className="mintBtnCntr">
        <TxButton
          label="Mint"
          type="SIGNED-TX"
          setStatus={setStatus}
          attrs={{
            palletRpc: 'marketplace',
            callable: 'mint',
            inputParams: [],
            paramFields: [],
          }}
        />
      </div>
      <div style={{ overflowWrap: 'break-word' }}>{status}</div>
    </Grid.Column>
  )
}

export default function Mint(props) {
  const { api } = useSubstrateState()
  return api.query.marketplace && api.query.marketplace.nextTokenId ? (
    <Main {...props} />
  ) : null
}
