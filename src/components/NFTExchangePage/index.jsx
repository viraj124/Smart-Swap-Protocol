import React, { useState, useReducer, useEffect } from 'react'
import ReactGA from 'react-ga'
import { createBrowserHistory } from 'history'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { useWeb3React, useNFTMarketPlaceContract, useTokenContract } from '../../hooks'
import { brokenTokens } from '../../constants'
import { amountFormatter, calculateGasMargin, isAddress, getCurrentRate } from '../../utils'

import { useTokenDetails, INITIAL_TOKENS_CONTEXT } from '../../contexts/Tokens'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressBalance } from '../../contexts/Balances'
import { useWalletModalToggle } from '../../contexts/Application'

import { Button } from '../../theme'
import CurrencyInputPanel from '../NFTInputPanel'
import OversizedPanel from '../OversizedPanel'
import { useAllTransactions } from '../../contexts/Transactions'

import TransactionDetails from '../TransactionDetails'
import ArrowDown from '../../assets/svg/SVGArrowDown'
import WarningCard from '../WarningCard'
import { async } from 'q'

const INPUT = 0
const OUTPUT = 1

const ETH_TO_TOKEN = 0
const TOKEN_TO_ETH = 1
const TOKEN_TO_TOKEN = 2

// denominated in bips
const ALLOWED_SLIPPAGE_DEFAULT = 50
const TOKEN_ALLOWED_SLIPPAGE_DEFAULT = 50

// 15 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

// % above the calculated gas cost that we actually send, denominated in bips
const GAS_MARGIN = ethers.utils.bigNumberify(100000)


const DownArrowBackground = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;
`

const WrappedArrowDown = ({ clickable, active, ...rest }) => <ArrowDown {...rest} />
const DownArrow = styled(WrappedArrowDown)`
  color: ${({ theme, active }) => (active ? theme.royalBlue : theme.chaliceGray)};
  width: 0.625rem;
  height: 0.625rem;
  position: relative;
  padding: 0.875rem;
  cursor: ${({ clickable }) => clickable && 'pointer'};
`

const ExchangeRateWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
`

const ExchangeRate = styled.span`
  flex: 1 1 auto;
  width: 0;
  color: ${({ theme }) => theme.doveGray};
`

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;

  button {
    max-width: 20rem;
  }
`

function calculateSlippageBounds(value, token = false, tokenAllowedSlippage, allowedSlippage) {
  if (value) {
    const minimum = value
    const maximum = value
    return {
      minimum: minimum < (ethers.constants.Zero) ? ethers.constants.Zero : minimum,
      maximum: maximum < (ethers.constants.MaxUint256) ? ethers.constants.MaxUint256 : maximum
    }
  } else {
    return {}
  }
}

function getSwapType(inputCurrency, outputCurrency) {
  if (!inputCurrency || !outputCurrency) {
    return null
  } else if (inputCurrency === 'ETH') {
    return ETH_TO_TOKEN
  } else if (outputCurrency === 'ETH') {
    return TOKEN_TO_ETH
  } else {
    return TOKEN_TO_TOKEN
  }
}

function getInitialSwapState(state) {
  return {
    independentValue: state.exactFieldURL && state.exactAmountURL ? state.exactAmountURL : '', // this is a user input
    dependentValue: '', // this is a calculated number
    independentField: state.exactFieldURL === 'output' ? OUTPUT : INPUT,
    inputCurrency: state.inputCurrencyURL ? state.inputCurrencyURL : 'ETH',
    outputCurrency: state.outputCurrencyURL
      ? state.outputCurrencyURL === 'ETH'
        ? state.inputCurrencyURL && state.inputCurrencyURL !== 'ETH'
          ? 'ETH'
          : ''
        : state.outputCurrencyURL
      : state.initialCurrency
        ? state.initialCurrency
        : ''
  }
}

function swapStateReducer(state, action) {
  switch (action.type) {
    case 'FLIP_INDEPENDENT': {
      const { independentField, inputCurrency, outputCurrency } = state
      return {
        ...state,
        dependentValue: '',
        independentField: independentField === INPUT ? OUTPUT : INPUT,
        inputCurrency: outputCurrency,
        outputCurrency: inputCurrency
      }
    }
    case 'SELECT_CURRENCY': {
      const { inputCurrency, outputCurrency } = state
      const { field, currency } = action.payload

      const newInputCurrency = field === INPUT ? currency : inputCurrency
      const newOutputCurrency = field === OUTPUT ? currency : outputCurrency

      if (newInputCurrency === newOutputCurrency) {
        return {
          ...state,
          inputCurrency: field === INPUT ? currency : '',
          outputCurrency: field === OUTPUT ? currency : ''
        }
      } else {
        return {
          ...state,
          inputCurrency: newInputCurrency,
          outputCurrency: newOutputCurrency
        }
      }
    }
    case 'UPDATE_INDEPENDENT': {
      const { field, value } = action.payload

      const { dependentValue, independentValue } = state
      return {
        ...state,
        independentValue: value,
        dependentValue: value,
        independentField: field
      }
    }
    case 'UPDATE_DEPENDENT': {
      return {
        ...state,
        dependentValue: action.payload
      }
    }
    default: {
      return getInitialSwapState()
    }
  }
}



export default function NFTExchangePage({ initialCurrency, params, nft = true }) {
  const { t } = useTranslation()
  const { account, chainId, library, error } = useWeb3React()

  const allTransactions = useAllTransactions()

  const nftMarketAddress = '0x1b5666b40f30231879f8a5dedfc78cdda7cacf77'

  const urlAddedTokens = {}
  if (params.inputCurrency) {
    urlAddedTokens[params.inputCurrency] = true
  }
  if (params.outputCurrency) {
    urlAddedTokens[params.outputCurrency] = true
  }
  if (isAddress(initialCurrency)) {
    urlAddedTokens[initialCurrency] = true
  }
  const addTransaction = useTransactionAdder()

  // check if URL specifies valid slippage, if so use as default
  const initialSlippage = (token = false) => {
    let slippage = Number.parseInt(params.slippage)
    if (!isNaN(slippage) && (slippage === 0 || slippage >= 1)) {
      return slippage // round to match custom input availability
    }
    // check for token <-> token slippage option
    return token ? TOKEN_ALLOWED_SLIPPAGE_DEFAULT : ALLOWED_SLIPPAGE_DEFAULT
  }


  var [brokenTokenWarning, setBrokenTokenWarning] = useState()

  const [deadlineFromNow, setDeadlineFromNow] = useState(DEFAULT_DEADLINE_FROM_NOW)

  const [rawSlippage, setRawSlippage] = useState(() => initialSlippage())
  const [rawTokenSlippage, setRawTokenSlippage] = useState(() => initialSlippage(true))

  const allowedSlippageBig = ethers.utils.bigNumberify(rawSlippage)
  const tokenAllowedSlippageBig = ethers.utils.bigNumberify(rawTokenSlippage)

  // analytics
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  // core swap state
  const [swapState, dispatchSwapState] = useReducer(
    swapStateReducer,
    {
      initialCurrency: initialCurrency,
      inputCurrencyURL: params.inputCurrency,
      outputCurrencyURL: params.outputCurrency,
      exactFieldURL: params.exactField,
      exactAmountURL: params.exactAmount
    },
    getInitialSwapState
  )

  const { independentValue, dependentValue, independentField, inputCurrency, outputCurrency } = swapState
  useEffect(() => {
    setBrokenTokenWarning(false)
    for (let i = 0; i < brokenTokens.length; i++) {
      if (
        brokenTokens[i].toLowerCase() === outputCurrency.toLowerCase() ||
        brokenTokens[i].toLowerCase() === inputCurrency.toLowerCase()
      ) {
        setBrokenTokenWarning(true)
      }
    }
  }, [outputCurrency, inputCurrency])

  // get swap type from the currency types
  const swapType = getSwapType(inputCurrency, outputCurrency)



  // get decimals and exchange address for each of the currency types --> 1
  const { symbol: inputSymbol, decimals: inputDecimals } = useTokenDetails(
    inputCurrency
  )
  const { symbol: outputSymbol, decimals: outputDecimals } = useTokenDetails(
    outputCurrency
  )

  // Selling LAND Not Supported
  if (inputSymbol === 'LAND') {
    brokenTokenWarning = true;
  }

  //Only ETH-LAND/MANA-LAND Allowed
  if ((outputSymbol != 'LAND')) {
    brokenTokenWarning = true
  }
  // Only ETH-LAND/MANA-LAND Supported
  if (inputSymbol != 'ETH' && inputSymbol != 'MANA') {
    brokenTokenWarning = true
  }

  // NFT Marketplace Address
  const contract = useNFTMarketPlaceContract(nftMarketAddress)

  // MANA Address for Approving the Market Place
  const manaContract = useTokenContract(inputCurrency)

  var title = 'Enter the Token Id You want to Buy';
 
  var input = 'The Current NFT Price is 1 Wei(We have fixed that Amount)'

  const initialRecipient = () => {
    if (params.recipient) {
      return params.recipient
    }
    return ''
  }

  const [recipient, setRecipient] = useState({
    address: initialRecipient(),
    name: ''
  })


  // get balances for each of the currency types
  const inputBalance = useAddressBalance(account, inputCurrency)
  const outputBalance = useAddressBalance(account, outputCurrency)
  const inputBalanceFormatted = !!(inputBalance && Number.isInteger(inputDecimals))
    ? amountFormatter(inputBalance, inputDecimals, Math.min(4, inputDecimals))
    : ''
  const outputBalanceFormatted = outputBalance

  // compute useful transforms of the data above
  const independentDecimals = independentField === INPUT ? inputDecimals : outputDecimals
  const dependentDecimals = independentField === OUTPUT ? inputDecimals : outputDecimals

  // declare/get parsed and formatted versions of input/output values
  const [independentValueParsed, setIndependentValueParsed] = useState()
  const dependentValueFormatted = dependentValue
  const inputValueParsed = 1
  const inputValueFormatted = 1
  const outputValueParsed = independentField === OUTPUT ? independentValueParsed : dependentValue
  var outputValueFormatted = independentField === OUTPUT ? independentValue : dependentValueFormatted
  // validate + parse independent value
  const [independentError, setIndependentError] = useState()
  useEffect(() => {
    if (independentValue && (independentDecimals || independentDecimals === 0)) {
      try {
        const parsedValue = ethers.utils.parseUnits(independentValue, independentDecimals)

        if (parsedValue.lte(ethers.constants.Zero) || parsedValue.gte(ethers.constants.MaxUint256)) {
          throw Error()
        } else {
          setIndependentValueParsed(parsedValue)
          setIndependentError(null)
        }
      } catch {
        setIndependentError(t('inputNotValid'))
      }

      return () => {
        setIndependentValueParsed()
        setIndependentError()
      }
    }
  }, [independentValue, independentDecimals, t])

  // calculate slippage from target rate
  const { minimum: dependentValueMinumum, maximum: dependentValueMaximum } = calculateSlippageBounds(

    dependentValue,
    swapType === TOKEN_TO_TOKEN,
    tokenAllowedSlippageBig,
    allowedSlippageBig
  )
  // validate input allowance + balance
  const [inputError, setInputError] = useState()
  const [showUnlock, setShowUnlock] = useState(false)
  useEffect(() => {
    const inputValueCalculation = independentField === INPUT ? independentValueParsed : dependentValueMaximum
    if (inputBalance && inputValueCalculation) {
      return () => {
        setInputError()
        setShowUnlock(false)
      }
    }
  }, [independentField, independentValueParsed, dependentValueMaximum, inputBalance, inputCurrency, t])


  useEffect(() => {
    const history = createBrowserHistory()
    history.push(window.location.pathname + '')
  }, [])
  // 5 calculating exchange rate replace this with exchange rate contract call
  const [inverted, setInverted] = useState(false)
  const exchangeRate = 1
  const exchangeRateInverted = 1

  // Have to hardcode it for the nft swap since it's there is no exchange innvolved here unlike uniswap so we don't need market rate
  const percentSlippageFormatted = 0
  const slippageWarning = false
  const highSlippageWarning = false



  const isValid = true

  const estimatedText = `(${t('estimated')})`
  function formatBalance(value) {
    return `Balance: ${value}`
  }

  //Replace with NFT Contract's functions
  async function onSwap() {
    //if user changed deadline, log new one in minutes
    if (deadlineFromNow !== DEFAULT_DEADLINE_FROM_NOW) {
      ReactGA.event({
        category: 'Advanced Interaction',
        action: 'Set Custom Deadline',
        value: deadlineFromNow / 60
      })
    }


    // if user has changed slippage, log
    if (swapType === TOKEN_TO_TOKEN) {
      if (parseInt(tokenAllowedSlippageBig.toString()) !== TOKEN_ALLOWED_SLIPPAGE_DEFAULT) {
        ReactGA.event({
          category: 'Advanced Interaction',
          action: 'Set Custom Slippage',
          value: parseInt(tokenAllowedSlippageBig.toString())
        })
      }
    } else {
      if (parseInt(allowedSlippageBig.toString()) !== ALLOWED_SLIPPAGE_DEFAULT) {
        ReactGA.event({
          category: 'Advanced Interaction',
          action: 'Set Custom Slippage',
          value: parseInt(allowedSlippageBig.toString())
        })
      }
    }

    let estimate, method, args, value

    let inputEthPerToken = 1
    let ethTransactionSize = inputEthPerToken * inputValueFormatted

    // params for GA event
    let action = ''
    let label = ''
    // set GA params
    action = 'SwapNFT'
    label = 'NFT Marketplace'
    if (swapType === ETH_TO_TOKEN) {
      estimate = contract.estimate.purchaseTokenETH
      method = contract.purchaseTokenETH
      args = [outputValueFormatted]
      value = await getCurrentRate(nftMarketAddress, library)

    } else if (swapType === TOKEN_TO_TOKEN) {
      const price = await getCurrentRate(nftMarketAddress, library)
      estimate = manaContract.estimate.approve
      method = manaContract.approve
      args = [nftMarketAddress, price]
      value = ethers.constants.Zero
      //calling approve function
      const estimatedGasLimit = await estimate(...args, { value })
      method(...args, {
        value,
        gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
      }).then(response => {
        addTransaction(response)
      })
      
      estimate = contract.estimate.purchaseTokenMana
      method = contract.purchaseTokenMana
      args = [outputValueFormatted, price]
      value = ethers.constants.Zero
    }

    const estimatedGasLimit = await estimate(...args, { value })
    method(...args, {
      value,
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
    }).then(response => {
      addTransaction(response)
      ReactGA.event({
        category: 'Transaction',
        action: action,
        label: label,
        value: ethTransactionSize,
        dimension1: response.hash
      })
      ReactGA.event({
        category: 'Hash',
        action: response.hash,
        label: ethTransactionSize.toString()
      })
    })

  }


  const [customSlippageError, setcustomSlippageError] = useState('')

  const toggleWalletModal = useWalletModalToggle()

  const newInputDetected =
    inputCurrency !== 'ETH' && inputCurrency && !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(inputCurrency)

  const newOutputDetected =
    outputCurrency !== 'ETH' && outputCurrency && !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(outputCurrency)

  const [showInputWarning, setShowInputWarning] = useState(false)
  const [showOutputWarning, setShowOutputWarning] = useState(false)



  useEffect(() => {
    if (newInputDetected) {
      setShowInputWarning(true)
    } else {
      setShowInputWarning(false)
    }
  }, [newInputDetected, setShowInputWarning])

  useEffect(() => {
    if (newOutputDetected) {
      setShowOutputWarning(true)
    } else {
      setShowOutputWarning(false)
    }
  }, [newOutputDetected, setShowOutputWarning])

  return (
    <>
      {showInputWarning && (
        <WarningCard
          onDismiss={() => {
            setShowInputWarning(false)
          }}
          urlAddedTokens={urlAddedTokens}
          currency={inputCurrency}
        />
      )}
      {showOutputWarning && (
        <WarningCard
          onDismiss={() => {
            setShowOutputWarning(false)
          }}
          urlAddedTokens={urlAddedTokens}
          currency={outputCurrency}
        />
      )}
      <CurrencyInputPanel
        title={input}
        urlAddedTokens={urlAddedTokens}
        description={inputValueFormatted && independentField === OUTPUT ? estimatedText : ''}
        extraText={inputBalanceFormatted && formatBalance(inputBalanceFormatted)}
        extraTextClickHander={() => {
          if (inputBalance && inputDecimals) {
            const valueToSet = inputCurrency === 'ETH' ? inputBalance.sub(ethers.utils.parseEther('.1')) : inputBalance
            if (valueToSet.gt(ethers.constants.Zero)) {
              dispatchSwapState({
                type: 'UPDATE_INDEPENDENT',
                payload: {
                  value: amountFormatter(valueToSet, inputDecimals, inputDecimals, false),
                  field: INPUT
                }
              })
            }
          }
        }}
        onCurrencySelected={inputCurrency => {
          dispatchSwapState({
            type: 'SELECT_CURRENCY',
            payload: { currency: inputCurrency, field: INPUT }
          })
        }}
        onValueChange={inputValue => {
          dispatchSwapState({
            type: 'UPDATE_INDEPENDENT',
            payload: { value: inputValue, field: INPUT }
          })
        }}
        showUnlock={showUnlock}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={inputCurrency}
        value={inputValueFormatted}
        errorMessage={inputError ? inputError : independentField === INPUT ? independentError : ''}
      />
      <OversizedPanel>
        <DownArrowBackground>
          <DownArrow
            onClick={() => {
              dispatchSwapState({ type: 'FLIP_INDEPENDENT' })
            }}
            clickable
            alt="swap"
            active={isValid}
          />
        </DownArrowBackground>
      </OversizedPanel>
      <CurrencyInputPanel
        title={title}
        description={outputValueFormatted && independentField === INPUT ? estimatedText : ''}
        extraText={outputBalanceFormatted && formatBalance(outputBalanceFormatted)}
        urlAddedTokens={urlAddedTokens}
        onCurrencySelected={outputCurrency => {
          dispatchSwapState({
            type: 'SELECT_CURRENCY',
            payload: { currency: outputCurrency, field: OUTPUT }
          })
        }}
        onValueChange={outputValue => {
          dispatchSwapState({
            type: 'UPDATE_INDEPENDENT',
            payload: { value: outputValue, field: OUTPUT }
          })
        }}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={outputCurrency}
        value={outputValueFormatted}
        errorMessage={independentField === OUTPUT ? independentError : ''}
        disableUnlock
      />

      <OversizedPanel hideBottom>
        <ExchangeRateWrapper
          onClick={() => {
            setInverted(inverted => !inverted)
          }}
        >
          <ExchangeRate>{t('exchangeRate')}</ExchangeRate>
          {inverted ? (
            <span>
              {exchangeRate
                ? `1 ${inputSymbol} = ${amountFormatter(exchangeRate, 18, 6, false)} ${outputSymbol}`
                : ' 0 '}
            </span>
          ) : (
              <span>
                {exchangeRate
                  ? `1 ${outputSymbol} = ${amountFormatter(exchangeRateInverted, 18, 6, false)} ${inputSymbol}`
                  : ' 0 '}
              </span>
            )}
        </ExchangeRateWrapper>
      </OversizedPanel>
      <TransactionDetails
        account={account}
        setRawSlippage={setRawSlippage}
        setRawTokenSlippage={setRawTokenSlippage}
        rawSlippage={rawSlippage}
        slippageWarning={slippageWarning}
        highSlippageWarning={highSlippageWarning}
        brokenTokenWarning={brokenTokenWarning}
        setDeadline={setDeadlineFromNow}
        deadline={deadlineFromNow}
        inputError={inputError}
        independentError={independentError}
        inputCurrency={inputCurrency}
        outputCurrency={outputCurrency}
        independentValue={independentValue}
        independentValueParsed={independentValueParsed}
        independentField={independentField}
        INPUT={INPUT}
        inputValueParsed={inputValueParsed}
        outputValueParsed={outputValueParsed}
        inputSymbol={inputSymbol}
        outputSymbol={outputSymbol}
        dependentValueMinumum={dependentValueMinumum}
        dependentValueMaximum={dependentValueMaximum}
        dependentDecimals={dependentDecimals}
        independentDecimals={independentDecimals}
        percentSlippageFormatted={percentSlippageFormatted}
        setcustomSlippageError={setcustomSlippageError}
        recipientAddress={recipient.address}
        sending={false}
      />
      <Flex>
        <Button
          disabled={
            brokenTokenWarning ? true : !account && !error ? false : !isValid || customSlippageError === 'invalid'
          }
          onClick={account && !error ? onSwap : toggleWalletModal}
          warning={highSlippageWarning || customSlippageError === 'warning'}
          loggedOut={!account}
        >
          {highSlippageWarning || customSlippageError === 'warning' ? t('swapAnyway') : t('swap')}
        </Button>
      </Flex>
    </>
  )
}