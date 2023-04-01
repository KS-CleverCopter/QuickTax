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
  Text,
  useTheme,
  useToast
} from '@chakra-ui/react'
import {FormEvent, useEffect, useState} from 'react'
// import DataTable from 'react-data-table-component'
import {CustomModal} from './CustomModal'
import {GrayBox} from './UiComponents'
import {Loader} from '../components/CommomComponents/loader'
import {CCDataTable} from './dataTable'

export const Termo = ({cpf, cname}: {cpf: string; cname: string}) => {
  // const columnPrefs = {
  //   fixedHeader: true
  // }

  const toast = useToast()
  const theme = useTheme()
  const gray = theme.colors.gray

  const [columns, setColumns] = useState<any>([])
  const [rowData, setRowData] = useState<any>([])
  const [dataLoading, setLoadTableData] = useState<boolean>(false)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [form, setForm] = useState<any>({
    id: '',
    qnty: '',
    ticker: '',
    marketType: '',
    transType: '',
    nticker: '',
    price: '',
    tradeDT: ''
  })

  const customStylesPopup = {
    rows: {
      style: {
        minHeight: '32px', // override the row height
        backgroundColor: gray['100'],
        color: gray['900']
      }
    },
    headCells: {
      style: {
        backgroundColor: gray['100'],
        fontWeight: 'bold',
        color: gray['900']
      }
    }
  }

  useEffect(() => {
    loadTableData()
  }, [])

  const getButton = (index: number) => {
    return `
    <div style='display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-start'>
        <button
        class='verifyAndConfirmDelete'
          index='${index}'
          type='Exercico'
          {...rowButtonStyles}>
          Exercico
        </button>
        </div>
        `
  }
  const loadTableData = () => {
    setLoadTableData(true)
    fetch(`${process.env.REACT_APP_API_HOST}/view.php?req=frm_termo&cid=` + cpf)
      .then(res => res.json())
      .then(r => {
        let columns: any = []
        if (r && r.data && r.data.length > 0) {
          Object.keys(r.data[0]).forEach(key => {
            if (key !== 'id' && key !== 'processed' && key !== 'price')
              columns.push({title: key, data: key})
          })
          for (let x = 0; x < r.data.length; x++) {
            Object.keys(r.data[x]).forEach(key => {
              if (key !== 'id' && key !== 'processed' && key !== 'price') {
                let row = r.data[x]
                if (key === 'Ações') {
                  row['Ações'] = getButton(x)
                }
              }
            })
          }
          setColumns(columns)
        }
        setRowData(r.data)
        setLoadTableData(false)
      })
  }

  const tableClick = (e: any) => {
    let elm = e.target
    let i = parseInt(elm.getAttribute('index'))
    rowButtonClicked('Exercicio', i)
  }
  const rowButtonClicked = (val: string, id: number) => {
    let row = rowData[id]
    setShowForm(true)
    let newForm = {
      rid: row['id'],
      qnty:
        row['Quantidade'] !== undefined && row['Quantidade'] !== null
          ? row['Quantidade']
          : '',
      ticker:
        row['Ativo'] !== undefined && row['Ativo'] !== null ? row['Ativo'] : '',
      transType: '',
      marketType:
        row['Tipo de mercado'] !== undefined && row['Tipo de mercado'] !== null
          ? row['Tipo de mercado']
          : '',
      nticker: '',
      price:
        row['price'] !== undefined && row['price'] !== null ? row['price'] : '',
      tradeDT: ''
    }
    setForm(newForm)
  }

  const updateData = (e: FormEvent, key: string) => {
    let elm = e.target as HTMLInputElement
    setForm((prev: any) => ({
      ...prev,
      [key]: elm.value
    }))
  }

  const formSubmit = (e: any) => {
    //This has all the formdata
    const data = new FormData()

    data.append('rid', form.rid)
    data.append('req', 'Termo')
    data.append('cid', cpf)
    data.append('transType', form.transType)
    data.append('ticker', form.nticker)
    data.append('price', form.price)
    data.append('tradeDate', form.tradeDT)

    // Do server upload API here.
    fetch(`${process.env.REACT_APP_API_HOST}/po_exercicio.php`, {
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
        loadTableData()
      })
    e.preventDefault()
  }

  return (
    <Box position={'relative'}>
      <Heading>Termo</Heading>

      <GrayBox
        props={{
          m: 4,
          mt: '7',
          p: 4,
          minWidth: '200px',
          width: '280px'
        }}>
        <HStack spacing={4} justifyContent="space-between" align={'middle'}>
          <Box w="50%">
            <Heading size="xs" mb="2">
              Nome
            </Heading>
            <Text>{cname}</Text>
          </Box>
          <Box w="50%">
            <Heading size="xs" mb="2px">
              CPF
            </Heading>
            <Text
              display="flex"
              alignItems="center"
              justifyContent="flexStart"
              h="33px">
              {cpf}
            </Text>
          </Box>
        </HStack>
      </GrayBox>
      {dataLoading && <Loader />}
      <CCDataTable
        refresh={true}
        refreshCallback={() => {
          setLoadTableData(true)
          loadTableData()
        }}
        data={rowData}
        colsArray={columns}
        colSearch={true}
        callBack={(e: any) => {
          tableClick(e)
        }}
      />
      {showForm && (
        <CustomModal
          size="2xl"
          onCloseCallBack={() => {
            setShowForm(false)
            loadTableData()
          }}>
          {form && (
            <Flex alignItems={'center'} justifyContent="flex-start" py="8">
              <FormControl>
                <form onSubmit={formSubmit}>
                  <Input type="hidden" value={form['rid']} />
                  <Heading size="lg" pb="4">
                    Termo
                  </Heading>
                  <HStack m="2" spacing="2">
                    <Box w="50%">
                      <FormLabel>Você quer transformar</FormLabel>
                    </Box>
                    <Box w="50%">
                      <Input w="100%" value={form['qnty']} readOnly={true} />
                    </Box>
                  </HStack>
                  <HStack m="2" spacing="2">
                    <Box w="50%">
                      <FormLabel>Do Ativo</FormLabel>
                    </Box>
                    <Box w="50%">
                      <Input value={form['ticker']} readOnly={true} />
                    </Box>
                  </HStack>
                  <HStack m="2" spacing="2">
                    <Box w="50%">
                      <FormLabel>Em uma</FormLabel>
                    </Box>
                    <Box w="50%">
                      <Select
                        value={form['transType']}
                        onChange={e => {
                          updateData(e, 'transType')
                        }}
                        required={true}>
                        <option value=""></option>
                        <option value="C">Compra / Buy</option>
                        <option value="V">Venda / Sell</option>
                      </Select>
                    </Box>
                  </HStack>
                  <HStack m="2" spacing="2">
                    <Box w="50%">
                      <FormLabel>Do Ativo</FormLabel>
                    </Box>
                    <Box w="50%">
                      <Input
                        value={form['nticker']}
                        onChange={e => {
                          updateData(e, 'nticker')
                        }}
                        required={true}
                      />
                    </Box>
                  </HStack>
                  <HStack m="2" spacing="2">
                    <Box w="50%">
                      {/* <FormLabel>Com o preço de</FormLabel> */}
                      <FormLabel>com o preço medio de</FormLabel>
                    </Box>
                    <Box w="50%">
                      <Input
                        value={form['price']}
                        onChange={e => {
                          updateData(e, 'price')
                        }}
                        type="number"
                        required={true}
                      />
                    </Box>
                  </HStack>
                  <HStack m="2" spacing="2">
                    <Box w="50%">
                      <FormLabel>Na data de</FormLabel>
                    </Box>
                    <Box w="50%">
                      <Input
                        value={form['tradeDT']}
                        onChange={e => {
                          updateData(e, 'tradeDT')
                        }}
                        type="date"
                        required={true}
                      />
                    </Box>
                  </HStack>
                  <Flex mt="6" alignItems={'center'} justifyContent={'center'}>
                    <Button type="submit" colorScheme={'orange'}>
                      Confirmar
                    </Button>
                  </Flex>
                </form>
              </FormControl>
            </Flex>
          )}
        </CustomModal>
      )}
    </Box>
  )
}
