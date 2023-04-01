/**
 * @format
 */
import {
  Box,
  Button,
  Heading,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  StackDivider,
  useDisclosure,
  VStack,
  useToast,
  Center,
  Flex
} from '@chakra-ui/react'
import {useEffect, useState} from 'react'
import {Loader} from './CommomComponents/loader'
import {CCDataTable} from './dataTable'
import {GrayBox} from './UiComponents'

export const UploadTable = ({
  updateData,
  tableCallBack
}: {
  updateData: number
  tableCallBack: () => void
}) => {
  const toast = useToast()
  const [columns, setColumns] = useState<any>([])
  const [rowData, setRowData] = useState<any>([])
  const [vAndCT1, setVAndCT1] = useState<any>([])
  const [modalDataLoading, setModalDataLoading] = useState<boolean>(false)
  const [vAndCT2, setVAndCT2] = useState<any>([])
  const [currentFileId, setCurrentFileId] = useState<string>('')
  const [dataUpdated, setDataUpdated] = useState<number>(0)

  const verifyAndConfirm = (i: number) => {
    let row = rowData[i]
    const file_id = row.FileId
    setModalDataLoading(true)
    onOpen()
    setCurrentFileId(file_id)
    const url = `${process.env.REACT_APP_API_HOST}/view.php?req=pdf_confirm&fid=${file_id}`
    fetch(url)
      .then(res => res.json())
      .then((data: any) => {
        ;[0, 1].forEach(i => {
          let columns: any = []
          let cData = i === 0 ? data.data : data.data1
          if (cData && cData.length) {
            Object.keys(cData[0]).forEach(key => {
              columns.push({
                name: key,
                sortable: true,
                selector: (row: any) => {
                  return row[key]
                },
                grow: 2
              })
            })
            if (i === 0) {
              setVAndCT1(cData)
            } else if (i === 1) {
              setVAndCT2(cData)
            }
          }
        })

        setModalDataLoading(false)
      })
  }
  const deleteData = (i: number) => {
    let row = rowData[i]
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure?') === true) {
      fetch(`${process.env.REACT_APP_API_HOST}/remFile.php?fid=${row.FileId}`)
        .then(res => res.json())
        .then(r => {
          if (r.status === 'Failed') {
            toast({
              title: 'Delete Failed',
              description: r.message,
              status: 'error',
              duration: 3000,
              isClosable: true,
              position: 'top'
            })
          } else {
            toast({
              title: 'Deleted',
              description: `${row.FileName} deleted.`,
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top'
            })
            setDataUpdated(performance.now())
          }
        })
    }
  }
  const confirmWriteToDB = () => {
    onClose()
    fetch(
      `${process.env.REACT_APP_API_HOST}/pdf_confirm.php?fid=${currentFileId}`
    )
      .then(res => res.json)
      .then((r: any) => {
        if (r.status === 'Failed') {
          toast({
            title: 'Failed',
            description: r.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top'
          })
        } else {
          toast({
            title: 'Data Confirmed.',
            description: r.message,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top'
          })
          setDataUpdated(performance.now())
          tableCallBack()
        }
      })
  }

  const url = `${process.env.REACT_APP_API_HOST}/view.php?req=pdf_status`
  const {isOpen, onOpen, onClose} = useDisclosure()
  const [tableDataLoading, setTableDataLoading] = useState<boolean>(false)
  const getButton = (index: number) => {
    return `
    <div style='display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-start'>
      <button
      class='verifyAndConfirm'
          index='${index}'
          type='verifyAndConfirm'
          {...rowButtonStyles}>
          Verify &amp; Confirm
        </button>
        <button
        class='verifyAndConfirmDelete'
          index='${index}'
          type='delete'
          {...rowButtonStyles}>
          Delete
        </button>
        </div>
        `
  }
  const loadData = () => {
    setTableDataLoading(true)
    fetch(url)
      .then(res => res.json())
      .then((data: any) => {
        let columns: any = []
        if (data && data.data && data.data.length > 0) {
          Object.keys(data.data[0]).forEach(key => {
            columns.push({title: key, data: key})
          })
          for (let x = 0; x < data.data.length; x++) {
            Object.keys(data.data[x]).forEach(key => {
              let row = data.data[x]
              if (
                key === 'ConfirmStatus' &&
                row[key] === 'Yet To Confirm' &&
                row['ParsingStatus'] !== 'Yet to Process' &&
                row['ParsingStatus'] !== 'In Progress'
              ) {
                row['ConfirmStatus'] = getButton(x)
              }
            })
          }
          setColumns(columns)
        }
        setRowData(data.data)
        setTableDataLoading(false)
      })
  }
  useEffect(() => {
    loadData()
  }, [updateData, dataUpdated])

  const tableClick = (e: any) => {
    let elm = e.target
    let i = parseInt(elm.getAttribute('index'))
    let type = elm.getAttribute('type')
    if (type === 'verifyAndConfirm') {
      verifyAndConfirm(i)
    } else if (type === 'delete') {
      deleteData(i)
    }
  }

  return (
    <Box minH={'350px'} position="relative">
      {tableDataLoading && <Loader />}
      {rowData && rowData.length > 0 && (
        <CCDataTable
          refresh={true}
          refreshCallback={() => {
            setModalDataLoading(true)
            setDataUpdated(dataUpdated + 1)
          }}
          data={rowData}
          colsArray={columns}
          colSearch={true}
          callBack={(e: any) => {
            tableClick(e)
          }}
        />
      )}
      {rowData && rowData.length === 0 && (
        <GrayBox props={{mt: 20, p: 10}}>
          <Flex w={'100%'} align="center" justifyContent={'center'}>
            <Heading>No Data</Heading>
          </Flex>
        </GrayBox>
      )}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent width="90%" padding={4} bgColor="gray.50">
          <ModalHeader>Confirm Data</ModalHeader>
          <ModalCloseButton />
          {modalDataLoading && (
            <Center>
              <Heading>Loading</Heading>
            </Center>
          )}
          {!modalDataLoading && (
            <VStack
              divider={<StackDivider borderColor="grey.200" />}
              spacing={4}
              align="stretch">
              <Box mb="12">
                <Heading mb="4" mt="8" px="4" size={'sm'}>
                  Table 1
                </Heading>
                <CCDataTable
                  data={vAndCT1}
                  refresh={true}
                  colSearch={true}
                  exportButtons={true}
                  refreshCallback={() => {
                    loadData()
                  }}
                />
              </Box>
              {vAndCT2 && vAndCT2.length && (
                <Box>
                  <Heading mb="4" mt="8" px="4" size={'sm'}>
                    Table 2
                  </Heading>
                  <CCDataTable
                    data={vAndCT2}
                    refresh={true}
                    colSearch={true}
                    exportButtons={true}
                    refreshCallback={() => {
                      loadData()
                    }}
                  />
                </Box>
              )}
            </VStack>
          )}

          <ModalFooter>
            {!modalDataLoading && (
              <Button onClick={confirmWriteToDB} colorScheme="green">
                Confirm &amp; write to DB
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
