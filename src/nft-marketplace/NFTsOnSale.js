import React, { useEffect, useState } from 'react'
import { Grid } from 'semantic-ui-react'
import './nft.css'
import { useSubstrateState } from '../substrate-lib'
import { TxButton } from '../substrate-lib/components'

function RenderNFTs(props) {
  const [sellOrderIds, setSellOrderIds] = useState([])
  const { api } = useSubstrateState()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('Fetching Number of NFTs On Sale')
    let unsubscribe
    setLoading(true)
    api.query.marketplace
      .numberOfSellOrders(val => {
        if (val.isNone) {
          setSellOrderIds([])
          console.log('Got 0 Orders')
        } else {
          let index = Array.from(Array(val.unwrap().toNumber()).keys())
          setSellOrderIds(index)
          console.log('Orders found on index', index)
        }
      })
      .then(unsub => {
        unsubscribe = unsub
      })
      .catch(console.error)
    setLoading(false)

    return () => unsubscribe && unsubscribe()
  }, [api])

  return (
    <Grid.Column width={16}>
      <h1>NFTs on sale</h1>
      <div className="NFTsContainer">
        {loading ? (
          'loading...'
        ) : sellOrderIds.length ? (
          sellOrderIds.map(val => <NFTCard orderId={val} key={val} />)
        ) : (
          <div className="cardHeader">No Sell Orders Found</div>
        )}
      </div>
    </Grid.Column>
  )
}

function NFTCard(props) {
  const [tokenId, setTokenId] = useState()
  const [status, setStatus] = useState('')
  //   const [price, setPrice] = useState('')
  //   const [isTokenOnSale, setIsTokenOnSale] = useState(-1)
  const { api } = useSubstrateState()
  const [tokenSalePrice, setTokenSalePrice] = useState(0)

  useEffect(() => {
    let unsubscribe
    api.query.marketplace
      .sellOrders(props.orderId, newValue => {
        if (newValue.isNone) {
          setTokenId('<None>')
          setTokenSalePrice('<None>')
          console.log(
            'Impossible shit just happened while fetching order on index',
            props.orderId
          )
        } else {
          setTokenId(newValue.value.tokenId.toNumber())
          setTokenSalePrice(newValue.value.sellPrice.toNumber())
          console.log(
            'Order with Token Id found : ',
            newValue.value.tokenId.toNumber()
          )
        }
      })
      .then(unsub => {
        unsubscribe = unsub
      })
      .catch(console.error)

    return () => unsubscribe && unsubscribe()
  }, [api])

  return (
    <div className="customCard">
      <div className="nftNumber">{'Order: ' + (props.orderId + 1)}</div>
      <div className="cardHeader">{'Token Id: ' + tokenId}</div>
      <div className="cardHeader">{'Sell Price: ' + tokenSalePrice}</div>
      <div className="onSale">
        <TxButton
          label="Buy"
          type="SIGNED-TX"
          setStatus={setStatus}
          attrs={{
            palletRpc: 'marketplace',
            callable: 'buy',
            inputParams: [tokenId],
            paramFields: [true],
          }}
        />
        <div style={{ maxWidth: '250px', overflowX: 'auto' }}>{status}</div>
      </div>
    </div>
  )
}

export default function NftsOnSale(props) {
  const { api } = useSubstrateState()
  return api.query.marketplace && api.query.marketplace.nextTokenId ? (
    <RenderNFTs {...props} />
  ) : null
}
