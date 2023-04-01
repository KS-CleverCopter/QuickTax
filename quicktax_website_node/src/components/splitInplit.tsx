/**
 * @format
 */
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  useToast
} from '@chakra-ui/react'
import {GrayBox} from './UiComponents'
import {AddIcon} from '@chakra-ui/icons'
import React, {useEffect, useState} from 'react'
import {CCDataTable} from './dataTable'
import {CustomModal} from './CustomModal'

export const SplitInplit = () => {
  const [tableData, setTableData] = useState<Array<object>>([])
  const [modalSplitInplit, setModalSplitInplit] = useState<boolean>(false)
  const [form, setForm] = useState<any>({})
  // const theme: any = useTheme()
  // const gray = theme.colors.gray

  const loadSplitData = () => {
    fetch(`${process.env.REACT_APP_API_HOST}/view.php?req=split`)
      .then(res => res.json())
      .then(r => {
        if (r.status === 'Success' && r.data.length > 0) {
          setTableData(r.data)
        }
      })
  }
  useEffect(() => {
    loadSplitData()
    setForm({
      split: '',
      multiplicator: '',
      date: '',
      ticker: ''
    })
  }, [])

  useEffect(() => {
    if (tableData && tableData.length > 0) {
      let cols: any = []
      Object.keys(tableData[0]).forEach(key => {
        if (key !== 'id' && key !== 'price') {
          cols.push({
            name: key,
            sortable: true,
            selector: (row: any) => {
              return row[key]
            },
            grow: 2,
            minWidth: '100px'
          })
        }
      })
    }
  }, [tableData])

  const handleChange = (e: React.FormEvent, key: string) => {
    let elm = e.target as HTMLFormElement
    setForm((prev: any) => ({
      ...prev,
      [key]: elm.value
    }))
  }
  const toast = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    setModalSplitInplit(false)
    const data = new FormData()

    data.append('split', form.split)
    data.append('mult', form.multiplicator)
    data.append('ticker', form.ticker)
    data.append('tradeDate', form.date)

    // Do server upload API here.
    fetch(`${process.env.REACT_APP_API_HOST}/split.php`, {
      method: 'POST',
      body: data
    })
      .then(res => res.json())
      .then(r => {
        if (r && r.status === 'Success') {
          toast({
            title: 'Data Saved!',
            description: r.message,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top'
          })
          // setForm([]);
        } else {
          toast({
            title: 'Failed to save!',
            description: 'Failed to save!',
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top'
          })
        }
        loadSplitData()
      })
    e.preventDefault()
  }

  return (
    <>
      <GrayBox
        props={{
          width: ['100%', '100%', '100%', '100%', 'calc(60% - 32px)'],
          m: 4
        }}>
        <Heading size="md" mb="6">
          Grupamento/Desdobramento
        </Heading>
        <HStack>
          <Input onChange={() => {}} placeholder="Ações..." />
          <Button
            leftIcon={<AddIcon />}
            w="300px"
            colorScheme="orange"
            onClick={() => {
              setModalSplitInplit(true)
            }}>
            Inplit/Split
          </Button>
        </HStack>
        <Box mt="4">
          <CCDataTable
            data={tableData}
            refresh={true}
            colSearch={true}
            refreshCallback={() => {
              loadSplitData()
            }}
          />
        </Box>
      </GrayBox>
      {modalSplitInplit && (
        <CustomModal
          size="xl"
          onCloseCallBack={() => {
            setModalSplitInplit(false)
          }}>
          <form onSubmit={handleSubmit}>
            <Box p="4">
              <HStack spacing="4" w="100%">
                <Box w="50%">
                  <FormControl>
                    <FormLabel>Split/Inplit</FormLabel>
                    <Select
                      required
                      value={form['split']}
                      onChange={(e: React.FormEvent) => {
                        handleChange(e, 'split')
                      }}>
                      <option value=""></option>
                      <option value="split">Split</option>
                      <option value="inplit">Inplit</option>
                    </Select>
                  </FormControl>
                  <FormControl mt="6">
                    <FormLabel>Ticker</FormLabel>
                    <Input
                      required
                      type="text"
                      value={form['ticker']}
                      onChange={(e: React.FormEvent) => {
                        handleChange(e, 'ticker')
                      }}
                    />
                  </FormControl>
                </Box>
                <Box w="50%">
                  <FormControl>
                    <FormLabel>Multiplicador</FormLabel>
                    <Input
                      required
                      type="number"
                      value={form['multiplicator']}
                      onChange={(e: React.FormEvent) => {
                        handleChange(e, 'multiplicator')
                      }}
                    />
                  </FormControl>

                  <FormControl mt="6">
                    <FormLabel>Data</FormLabel>
                    <Input
                      required
                      type="date"
                      value={form['date']}
                      onChange={(e: React.FormEvent) => {
                        handleChange(e, 'date')
                      }}
                    />
                  </FormControl>
                </Box>
              </HStack>
              <Flex justifyContent="flex-end" align="center" w="100%">
                <FormControl mt="4" w="auto">
                  <Button type="submit" colorScheme="orange">
                    Submit
                  </Button>
                </FormControl>
              </Flex>
            </Box>
          </form>
        </CustomModal>
      )}
    </>
  )
}
