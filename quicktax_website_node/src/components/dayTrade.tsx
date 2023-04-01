/**
 * @format
 */
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  useTheme
} from '@chakra-ui/react'
import {useEffect, useState} from 'react'
// import DataTable from 'react-data-table-component'
import {Loader} from './CommomComponents/loader'
import {CCDataTable} from './dataTable'
import {GrayBox} from './UiComponents'

export const DayTrade = ({cpf, cname}: {cpf: string; cname: string}) => {
  const columnPrefs = {
    fixedHeader: true
  }

  const theme = useTheme()
  const gray = theme.colors.gray
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

  const [tableData, setTableData] = useState<any>([])
  const [dataLoading, setLoadTableData] = useState<boolean>(false)
  const loadTableData = () => {
    setLoadTableData(true)
    fetch(`${process.env.REACT_APP_API_HOST}/view.php?req=dt&cid=` + cpf)
      .then(res => res.json())
      .then(r => {
        if (r.status === 'Success' && r.data.length > 0) {
          setTableData(r)
        }
        setLoadTableData(false)
      })
  }

  useEffect(() => {
    loadTableData()
  }, [])

  const [columns, setColumns] = useState<any>([])

  useEffect(() => {
    if (tableData && tableData.data) {
      let cols: any = []
      Object.keys(tableData.data[0]).forEach(key => {
        cols.push({
          name: key,
          sortable: true,
          selector: (row: any) => {
            return row[key]
          },
          grow: 3,
          maxWidth: '180px',
          minWidth: '100px'
        })
      })
      setColumns(cols)
    }
  }, [tableData])

  return (
    <Box position={'relative'}>
      <Heading>Day Trade</Heading>

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
        data={tableData.data}
        refresh={true}
        colSearch={true}
        refreshCallback={() => {
          setLoadTableData(true)
          loadTableData()
        }}
      />
    </Box>
  )
}
