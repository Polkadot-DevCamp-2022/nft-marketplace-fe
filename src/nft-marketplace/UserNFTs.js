import React, { useEffect, useState } from 'react'
import { Form, Input, Grid } from 'semantic-ui-react'
import './nft.css'
import { useSubstrateState } from '../substrate-lib'
import { TxButton } from '../substrate-lib/components'

function RenderUserNFTs(props) {
  const [nftIds, setNftIds] = useState([])
  const { api, currentAccount } = useSubstrateState()
  const getAddr = acct => (acct ? acct.address : '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('Fetching Number of NFTs')
    currentAccount && console.log(getAddr(currentAccount))
    let unsubscribe
    currentAccount && setLoading(true)
    currentAccount &&
      api.query.marketplace
        .ownerToNumberOfNFTs(getAddr(currentAccount), val => {
          if (val.isNone) {
            setNftIds([])
            console.log('Got 0 nfts')
          } else {
            let index = Array.from(Array(val.unwrap().toNumber()).keys())
            setNftIds(index)
            console.log('Nfts found on index', index)
          }
        })
        .then(unsub => {
          unsubscribe = unsub
        })
        .catch(console.error)
    setLoading(false)

    return () => unsubscribe && unsubscribe()
  }, [api, currentAccount])

  return (
    <Grid.Column width={8}>
      <h1>Users NFTs</h1>
      <div className="NFTsContainer">
        {loading ? (
          'loading...'
        ) : nftIds.length ? (
          nftIds.map(val => <NFTCard Id={val} key={val} />)
        ) : (
          <div className="cardHeader">User does not have any NFT</div>
        )}
      </div>
    </Grid.Column>
  )
}

function NFTCard(props) {
  const [tokenId, setTokenId] = useState()
  const [status, setStatus] = useState('')
  const [price, setPrice] = useState('')
  const [isTokenOnSale, setIsTokenOnSale] = useState(-1)
  const { api, currentAccount } = useSubstrateState()
  const [tokenSalePrice, setTokenSalePrice] = useState(0)
  const getAddr = acct => (acct ? acct.address : '')

  useEffect(() => {
    let unsubscribe
    currentAccount &&
      api.query.marketplace
        .ownerToTokenIds(getAddr(currentAccount), props.Id, newValue => {
          if (newValue.isNone) {
            setTokenId('<None>')
            console.log('Impossible shit just happened')
          } else {
            setTokenId(newValue.unwrap().toNumber())
            console.log('Token Id found : ', newValue.unwrap().toNumber())
          }
        })
        .then(unsub => {
          unsubscribe = unsub
        })
        .catch(console.error)

    return () => unsubscribe && unsubscribe()
  }, [api, currentAccount])

  useEffect(() => {
    let unsubscribe
    tokenId !== undefined &&
      api.query.marketplace
        .isTokenOnSale(tokenId, val => {
          if (!val.isNone) {
            setIsTokenOnSale(val.unwrap().toNumber())
            console.log(
              'tokenId:',
              tokenId,
              ' is on sale. Sell order index: ',
              val.unwrap().toNumber()
            )
          } else {
            setIsTokenOnSale(-1)
            console.log('tokenId:', tokenId, ' is not sale.')
          }
        })
        .then(unsub => {
          unsubscribe = unsub
        })
        .catch(console.error)

    return () => unsubscribe && unsubscribe()
  }, [tokenId])

  useEffect(() => {
    let unsubscribe
    isTokenOnSale !== -1 &&
      api.query.marketplace
        .sellOrders(isTokenOnSale, order => {
          if (!order.isNone) {
            setTokenSalePrice(order.value.sellPrice)
            console.log('Fetched Sell Order', order.value.sellPrice)
          }
        })
        .then(unsub => {
          unsubscribe = unsub
        })
        .catch(console.error)

    return () => unsubscribe && unsubscribe()
  }, [isTokenOnSale])

  return (
    <div className="customCard">
      <div className="nftNumber">{'NFT: ' + (props.Id + 1)}</div>
      <div className="cardHeader">{'Token Id: ' + tokenId}</div>
      <div className="onSale">
        {isTokenOnSale !== -1 ? (
          <>
            <div className="tokenOnSale">
              {'Token is On Sale with price: ' + tokenSalePrice}
            </div>
            <div className="cancelButton">
              <TxButton
                label="Cancel Order"
                type="SIGNED-TX"
                setStatus={setStatus}
                attrs={{
                  palletRpc: 'marketplace',
                  callable: 'cancelOrder',
                  inputParams: [tokenId],
                  paramFields: [true],
                }}
              />
            </div>
          </>
        ) : (
          <Form>
            <Form.Field>
              <Input
                label="Sell Price"
                state="newValue"
                type="number"
                onChange={(_, { value }) => setPrice(value)}
              />
            </Form.Field>
            <Form.Field style={{ textAlign: 'center' }}>
              <TxButton
                label="Sell"
                type="SIGNED-TX"
                setStatus={setStatus}
                attrs={{
                  palletRpc: 'marketplace',
                  callable: 'sell',
                  inputParams: [tokenId, price],
                  paramFields: [true, true],
                }}
              />
            </Form.Field>
            <div style={{ maxWidth: '250px', overflowX: 'auto' }}>{status}</div>
          </Form>
        )}
      </div>
    </div>
  )
}

export default function UserNFTs(props) {
  const { api } = useSubstrateState()
  return api.query.marketplace && api.query.marketplace.nextTokenId ? (
    <RenderUserNFTs {...props} />
  ) : null
}
