/**
 * @format
 */
import {AddIcon} from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Select,
  useToast
} from '@chakra-ui/react'
import React, {FormEvent, useEffect, useRef, useState} from 'react'
import {CustomModal} from '../components/CustomModal'
import {NovaMovimentoForm} from '../components/NovaMovimentoForm'
import {PoExercicio} from '../components/poExcercio'
import {Termo} from '../components/Termo'
import {DayTrade} from '../components/dayTrade'
import {Exportar} from '../components/exportar'
import {DeleteClient} from '../components/deleteClient'
import {GrayBox} from '../components/UiComponents'
import {UploadTable} from '../components/UploadTable'
import {Header} from './header'
import {AutoComplete} from '../components/CommomComponents/autoComplete'
import {SplitInplit} from '../components/splitInplit'
// import DataTable from 'react-data-table-component'
// import {CCDataTable} from '../components/dataTable'

export const Dashboard = () => {
  const toast = useToast()
  const inputRef = useRef(null)
  const [fileType, setFileType] = useState('normal')
  const [PDFType, setPDFType] = useState('0')
  const [fileUploaded, setFileUploaded] = useState<number>(0)
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)
  const headingStyles = {size: 'md', mb: '6'}
  const smallFormStyles = {p: 5, mx: 1, w: 'calc(50% - 8px)'}
  const formTypes = [
    {
      name: 'Nova movimento',
      colorScheme: 'orange',
      id: 'novaMovimento',
      cnfBtn: 'Adicionar'
    },
    {
      name: 'Pó/Exercício',
      colorScheme: 'orange',
      id: 'PoExercicio',
      cnfBtn: 'Procurar'
    },
    {name: 'Termo', colorScheme: 'orange', id: 'Termo', cnfBtn: 'Procurar'},
    {
      name: 'Day Trade',
      colorScheme: 'orange',
      id: 'DayTrade',
      cnfBtn: 'Visualizar'
    },
    {
      name: 'Exportar',
      colorScheme: 'orange',
      id: 'Exportar',
      cnfBtn: 'Procurar'
    },
    {
      name: 'Deletar um cliente',
      colorScheme: 'red',
      id: 'DeletarCli',
      cnfBtn: 'Deletar'
    }
  ]
  const [formStates, setFormStates] = useState<any>(null)
  const [clients, setClients] = useState<any>([])

  // Modal States
  const [modalNovaMovimento, setModalNovaMovimento] = useState<boolean>(false)
  const [modalPoExcercio, setModalPoExcercio] = useState<boolean>(false)
  const [modalTermo, setModalTermo] = useState<boolean>(false)
  const [modalDayTrade, setModalDayTrade] = useState<boolean>(false)
  const [modalExportar, setModalExportar] = useState<boolean>(false)
  const [modalDelete, setModalDelete] = useState<boolean>(false)

  const loadClients = () => {
    fetch(`${process.env.REACT_APP_API_HOST}/view.php?req=clnts`)
      .then(res => res.json())
      .then(r => {
        setClients(JSON.parse(r.data[0].clnts))
      })

    setFileUploaded(performance.now())
  }
  useEffect(() => {}, [clients])
  useEffect(() => {
    resetFormStates()
    loadClients()
  }, [])
  const resetFormStates = () => {
    const temp: any = {}
    formTypes.forEach(obj => {
      temp[obj.id] = {id: '', name: ''}
    })

    setFormStates(temp)
  }

  const handleChange = () => {
    let elm: any = inputRef.current
    if (elm && elm.files) {
      let formData = new FormData()
      formData.append('fileToUpload', elm.files[0])
      formData.append('fileType', fileType)
      const requestMeta = {
        method: 'POST',
        body: formData
      }
      setUploadLoading(true)
      fetch(`${process.env.REACT_APP_API_HOST}/upload.php`, requestMeta)
        .then(res => res.json())
        .then(data => {
          setUploadLoading(false)
          if (data.status === 'Failed') {
            toast({
              title: 'upload Failed.',
              description: data.description,
              status: 'error',
              duration: 3000,
              isClosable: true,
              position: 'top'
            })
          } else {
            toast({
              title: 'Upload Success.',
              description: data.filename,
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top'
            })
            setFileUploaded(performance.now())
          }
        })
    }
  }
  const updateFormStates = (key: string, item: any) => {
    setFormStates((prev: any) => ({
      ...prev,
      [key]: item
    }))
  }
  const formTypeClick = (e: FormEvent, formType: any) => {
    if (formStates[formType.id]) {
      if (formType.id === 'novaMovimento') {
        setModalNovaMovimento(true)
      } else if (formType.id === 'PoExercicio') {
        setModalPoExcercio(true)
      } else if (formType.id === 'Termo') {
        setModalTermo(true)
      } else if (formType.id === 'DayTrade') {
        setModalDayTrade(true)
      } else if (formType.id === 'Exportar') {
        setModalExportar(true)
      } else if (formType.id === 'DeletarCli') {
        setModalDelete(true)
      }
    } else {
      toast({
        title: 'Error',
        description: 'CPF cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      })
    }
    e.preventDefault()
  }

  return (
    <>
      <Header selectedMenu="/" />
      <Flex justifyContent={'space-between'} flexWrap="wrap" flexGrow="1">
        <GrayBox
          props={{
            width: ['100%', '100%', '100%', '100%', 'calc(60% - 32px)'],
            m: 4
          }}>
          <Flex justifyContent={'space-between'}>
            <Flex>
              <Select
                w="100px"
                bgColor={'white'}
                onChange={e => {
                  setPDFType(e.target.value)
                }}>
                <option value="0">All</option>
                <option value="1">Futuro</option>
                <option value="2">Vista, Termo, De opções</option>
                <option value="3">Lucro, Prejuízo</option>
              </Select>
              <Button
                px="4"
                ml={2}
                colorScheme={'orange'}
                onClick={() => {
                  // eslint-disable-next-line no-restricted-globals
                  if (
                    // eslint-disable-next-line no-restricted-globals
                    confirm(
                      'Do you really want to Clear the entire Storage. ?'
                    ) === true
                  ) {
                    fetch(
                      `${process.env.REACT_APP_API_HOST}/clrdb.php?ftype=${PDFType}`
                    )
                      .then(res => res.json())
                      .then(r => {
                        if (r.status === 'Failed') {
                          toast({
                            title: 'Delete Failed.',
                            description: r.message,
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                            position: 'top'
                          })
                        } else {
                          toast({
                            title: 'DB Cleared.',
                            description: r.message || '',
                            status: 'success',
                            duration: 3000,
                            isClosable: true,
                            position: 'top'
                          })
                          // setTimeout(() => {
                          loadClients()
                          // })
                          // setFileUploaded(performance.now())
                        }
                      })
                  }
                }}>
                Limpar estoque
              </Button>
            </Flex>
            <form>
              <HStack>
                <Select
                  id="fileType"
                  value={fileType}
                  mr="2"
                  bg="white"
                  w="100px"
                  onChange={(e: any) => {
                    setFileType(e.target.value)
                  }}>
                  <option value="normal">Normal</option>
                  <option value="safra">Safra</option>
                </Select>
                <input
                  style={{
                    color: 'grey.900',
                    width: '200px',
                    padding: '4px',
                    borderRadius: '5px',
                    backgroundColor: 'white'
                  }}
                  type="file"
                  ref={inputRef}
                />

                <Button
                  isLoading={uploadLoading}
                  colorScheme={'orange'}
                  px="4"
                  minW="88px"
                  onClick={(e: any) => {
                    handleChange()
                  }}>
                  <AddIcon w={'10px'} mr="6px" />
                  Upload
                </Button>
              </HStack>
            </form>
          </Flex>
          <Box mt="6">
            <UploadTable
              updateData={fileUploaded}
              tableCallBack={() => {
                loadClients()
              }}
            />
          </Box>
        </GrayBox>
        <Flex
          w={['100%', '100%', '100%', '100%', 'calc(40% - 12px)']}
          flexWrap={'wrap'}
          mx={[0, 0, 0, '3', '2']}>
          {formStates &&
            formTypes.map(obj => (
              <GrayBox key={obj.name} props={{...smallFormStyles}}>
                <Heading {...headingStyles}>{obj.name}</Heading>
                <form
                  onSubmit={e => {
                    formTypeClick(e, obj)
                  }}>
                  <AutoComplete
                    onSelectCallBack={itm => {
                      updateFormStates(obj.id, itm)
                    }}
                    validation={{
                      required: true
                    }}
                    data={clients}
                  />

                  <Flex justifyContent={'flex-end'}>
                    <Button type="submit" my="4" colorScheme={obj.colorScheme}>
                      {obj.cnfBtn} {obj.id}
                    </Button>
                  </Flex>
                </form>
              </GrayBox>
            ))}
        </Flex>
      </Flex>
      {/* <Box>
        <SplitInplit></SplitInplit>
      </Box> */}

      {modalNovaMovimento && (
        <CustomModal
          onCloseCallBack={() => {
            setModalNovaMovimento(false)
          }}>
          {formStates && (
            <NovaMovimentoForm
              cpf={formStates['novaMovimento']['id']}
              cname={formStates['novaMovimento']['name']}
            />
          )}
        </CustomModal>
      )}
      {modalPoExcercio && (
        <CustomModal
          onCloseCallBack={() => {
            setModalPoExcercio(false)
          }}>
          {formStates && (
            <PoExercicio
              cpf={formStates['PoExercicio']['id']}
              cname={formStates['PoExercicio']['name']}
            />
          )}
        </CustomModal>
      )}
      {modalTermo && (
        <CustomModal
          onCloseCallBack={() => {
            setModalTermo(false)
          }}>
          {formStates && (
            <Termo
              cpf={formStates['Termo']['id']}
              cname={formStates['Termo']['name']}
            />
          )}
        </CustomModal>
      )}
      {modalDayTrade && (
        <CustomModal
          onCloseCallBack={() => {
            setModalDayTrade(false)
          }}>
          {formStates && (
            <DayTrade
              cpf={formStates['DayTrade']['id']}
              cname={formStates['DayTrade']['name']}
            />
          )}
        </CustomModal>
      )}
      {modalExportar && (
        <CustomModal
          size="xl"
          onCloseCallBack={() => {
            setModalExportar(false)
          }}>
          {formStates && (
            <Exportar
              cpf={formStates['Exportar']['id']}
              cname={formStates['Exportar']['name']}
            />
          )}
        </CustomModal>
      )}
      {modalDelete && (
        <CustomModal
          size="xl"
          onCloseCallBack={() => {
            setModalDelete(false)
            loadClients()
          }}>
          {formStates && (
            <DeleteClient
              cpf={formStates['DeletarCli']['id']}
              cname={formStates['DeletarCli']['name']}
              successCallback={() => {
                //Clearing all CPF after delete
                resetFormStates()
                setClients([])
              }}
            />
          )}
        </CustomModal>
      )}
    </>
  )
}
