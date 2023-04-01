/**
 * @format
 */

import {Box, Button, FormControl, Input} from '@chakra-ui/react'
import React, {useEffect, useRef, useState} from 'react'
import Fuse from 'fuse.js'
interface chakraValidation {
  required: boolean
}
export const AutoComplete = ({
  data,
  onSelectCallBack,
  validation
}: {
  validation?: chakraValidation
  data: any
  onSelectCallBack: (item: any) => void
}) => {
  const [searchValue, setSearchValue] = useState<string>('')
  const [result, setResult] = useState<Array<any>>([])
  const [showResults, setShowResults] = useState<boolean>(false)
  const [selectedResult, setSelectedResult] = useState<object>({})
  const [processedData, setProcessedData] = useState<any>({})
  const [fuse, setFuse] = useState<any>()
  // useEffect(() => {
  //   setFuse()
  // }, [])

  useEffect(() => {
    const _processedData: any = []
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        let obj: any = {}
        obj['id'] = key
        obj['name'] = data[key]

        _processedData.push(obj)
      }
    }
    setProcessedData(_processedData)
    setFuse(
      new Fuse(_processedData, {
        keys: ['name']
      })
    )
    // setSearchValue('')
  }, [data])
  const [filter, setFilter] = useState<boolean>(true)
  // getting the result
  useEffect(() => {
    if (Object.keys(selectedResult).length === 0) {
      setSelectedResult({id: searchValue, name: ''})
    }
  }, [selectedResult, searchValue])

  useEffect(() => {
    onSelectCallBack(selectedResult)
  }, [selectedResult])

  useEffect(() => {
    if (filter && fuse) {
      setSelectedResult({})
      let result: any = fuse.search(searchValue)
      if (result.length) {
        setShowResults(true)
        setResult(result)
      } else {
        setResult([])
      }
    }
  }, [searchValue])
  const boxRef = useRef(null)
  const selectedValue = (key: string, value: string) => {
    let item = {
      id: key,
      name: value
    }

    setSearchValue(value)
    setFilter(false)
    setShowResults(false)
    setSelectedResult(item)

    setResult([])
  }
  return (
    <>
      {fuse && (
        <Box ref={boxRef} width="100%" position={'relative'}>
          <FormControl>
            <Input
              {...validation}
              value={searchValue}
              onChange={(e: React.FormEvent) => {
                if (!filter) {
                  setFilter(true)
                }
                let elm = e.target as HTMLInputElement
                setSearchValue(elm.value)
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowResults(false)
                }, 100)
              }}
              onClick={() => {
                if (searchValue === '') {
                  let items: any = []
                  processedData.forEach((obj: any) => {
                    items.push({item: {...obj}})
                  })
                  setShowResults(true)
                  setResult(items)
                }
              }}
            />
            {result.length > 0 && showResults && (
              <>
                <Box
                  position={'absolute'}
                  top="35px"
                  width="100%"
                  maxH={'500px'}
                  zIndex="4"
                  overflow={'scroll'}
                  bgColor={'gray.50'}
                  borderBottomRadius="4"
                  boxShadow={'lg'}>
                  {result.map((obj: any) => (
                    <Button
                      key={`${obj.item.id}_result`}
                      width={'100%'}
                      color="gray.700"
                      justifyContent="flex-start"
                      variant={'ghost'}
                      _hover={{bg: 'blue.100'}}
                      onClick={() => {
                        selectedValue(obj.item.id, obj.item.name)
                      }}>
                      {obj.item?.name}
                    </Button>
                  ))}
                </Box>
              </>
            )}
          </FormControl>
        </Box>
      )}
    </>
  )
}
