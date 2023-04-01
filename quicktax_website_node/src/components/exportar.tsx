/**
 * @format
 */
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Checkbox,
  Text,
  useToast
} from '@chakra-ui/react'
import DatePicker from 'react-datepicker'
import {useState} from 'react'
import {GrayBox} from './UiComponents'
import 'react-datepicker/dist/react-datepicker.css'
import {Loader} from './CommomComponents/loader'

export const Exportar = ({cpf, cname}: {cpf: string; cname: string}) => {
  const toast = useToast()
  const [monYr, setMonYr] = useState<any>(null)
  const [exportFile, setExportFile] = useState<String>('')
  const [allMonths, setAllMonths] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const updateAllMonths = (e: any) => {
    let elm = e.target as HTMLInputElement

    let val: any = elm.value
    if (elm.type === 'checkbox') {
      val = elm.checked
    }
    setAllMonths(val)
  }
  const formSubmit = (e: any) => {
    //This has all the formdata
    let dt = new Date(monYr)

    setIsLoading(true)
    const data = new FormData()
    data.append('cid', cpf)
    data.append(
      'monYr',
      (dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1) +
        '-' +
        dt.getFullYear()
    )
    data.append('allMon', allMonths === true ? '1' : '0')

    e.preventDefault()
    // Do server upload API here.
    fetch(`${process.env.REACT_APP_API_HOST}/export.php`, {
      method: 'POST',
      body: data
    })
      .then(res => res.json())
      .then(r => {
        if (r && r.status === 'Success') {
          setExportFile(r.message)
          setIsLoading(false)
        } else {
          toast({
            title: 'Failed to export!',
            description: 'Failed to export!',
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top'
          })
        }
      })

    e.preventDefault()
  }
  return (
    <Box position={'relative'}>
      <Heading>Exportar</Heading>
      {isLoading && <Loader />}
      <FormControl>
        <form onSubmit={formSubmit}>
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
          <Box p="5">
            <Box mt="8">
              <HStack spacing="4" alignItems="flex-end">
                <Box>
                  <FormLabel>Qual mes / ano vai ser extraído ?</FormLabel>
                  <Box
                    fontSize={'11px'}
                    borderColor="grey.400"
                    borderWidth="1px"
                    p="8px"
                    py="6px"
                    borderRadius={'lg'}>
                    <DatePicker
                      placeholderText="MM/YYYY"
                      selected={monYr}
                      onChange={(date: Date) => setMonYr(date)}
                      dateFormat="MM/yyyy"
                      showMonthYearPicker
                    />
                  </Box>
                </Box>
              </HStack>

              <Box mb="4">
                <Checkbox
                  pb="2"
                  value="allMonths"
                  mt="2"
                  onChange={e => {
                    updateAllMonths(e)
                  }}
                />
                Todos os meses movimentados
              </Box>

              <Box>
                <Button
                  isLoading={isLoading}
                  type="submit"
                  colorScheme={'orange'}>
                  Submit
                </Button>
                {exportFile && (
                  <>
                    <a href={`${exportFile}`}> Download File </a>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </form>
      </FormControl>
    </Box>
  )
}
