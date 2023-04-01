/**
 * @format
 */
import {Box, Button, Flex, Heading, Input} from '@chakra-ui/react'
import React, {useEffect, useRef, useState} from 'react'
import rightChevron from '../assets/imgs/rightChevron.svg'
import leftChevron from '../assets/imgs/leftChevron.svg'
import rightDoubleChevron from '../assets/imgs/rightDoubleChevron.svg'
import leftDoubleChevron from '../assets/imgs/leftDoubleChevron.svg'
import {GrayBox} from './UiComponents'
import 'datatables.net-buttons'

const dt = require('datatables.net')

const dtButtons = require('datatables.net-buttons-dt')
const html5JS = require('datatables.net-buttons/js/buttons.html5.js')
const buttonPrint = require('datatables.net-buttons/js/buttons.print.js')

interface DataTableColsType {
  title: string
  data: string
}
export const CCDataTable = ({
  data = [],
  exportButtons = false,
  colsArray = [],
  dataTableOpts,
  callBack,
  colSearch = false,
  refresh = true,
  refreshCallback
}: {
  data: any
  exportButtons?: boolean
  colsArray?: Array<DataTableColsType>
  dataTableOpts?: any
  callBack?: Function
  colSearch?: boolean
  refresh: boolean
  refreshCallback: Function
}) => {
  const tableRef: null | any = useRef(null)
  const [tableColumnSearchFields, setTableColumnSearchFields] = useState<any>(
    {}
  )
  const [colsWidth, setColsWidth] = useState<Array<number>>([])
  const [dts, setDts] = useState<any>('')
  const [colSearchRender, setColSearchRender] = useState<number>(1)
  const [tableWidth, setTableWidth] = useState<string>('0')
  const [tableColumnsData, setTableColumnsData] = useState<
    Array<DataTableColsType>
  >([])
  useEffect(() => {
    if (data && data.length > 0) {
      if (colsArray.length === 0) {
        let columns: any = []
        Object.keys(data[0]).forEach(key => {
          columns.push({title: key, data: key})
        })
        setTableColumnsData(columns)
      } else {
        setTableColumnsData(colsArray)
      }
    }
  }, [data])
  useEffect(() => {
    let tColSearch: any = {}
    tableColumnsData.forEach((obj: DataTableColsType) => {
      tColSearch[obj.title] = ''
    })
    setTableColumnSearchFields(tColSearch)
    let dom = 'tpil'
    if (!colSearch) {
      dom = 'f' + dom
    }

    if (exportButtons) {
      dom += 'B'
    }

    if (data && data.length > 0 && tableColumnsData.length > 0) {
      if (dts) {
        dts.destroy()
      }

      const d = new dt(tableRef.current, {
        pagingType: 'first_last_numbers',
        dom: dom,
        autoWidth: false,
        language: {
          search: '',
          searchPlaceholder: 'Search',
          paginate: {
            first: `<img src='${leftDoubleChevron}' width="8px" height="8px" />`,
            last: `<img src='${rightDoubleChevron}' width="8px" height="8px" />`,
            next: `<img src='${rightChevron}' width="6px" height="6px" />`,
            previous: `<img src='${leftChevron}' width="6px" height="6px" />`
          }
        },
        data: data,
        columns: tableColumnsData,
        columnDefs: [{searchable: true, defaultContent: '-', targets: '_all'}],
        initComplete: (table: any) => {
          setTimeout(() => {
            let tcols: Array<number> = []
            table.aoHeader[0].forEach((cell: any) => {
              tcols.push(parseInt(cell.cell.getBoundingClientRect().width) + 4)
            })

            setTableWidth(table.nTable.getBoundingClientRect().width + 'px')
            setColsWidth(tcols)
          }, 200)
        },
        lengthMenu: [
          [10, 25, 50, 100, -1],
          [10, 25, 50, 100, 'All']
        ],
        fixedColumns: true,
        buttons: ['copy', 'csv'],
        order: []
      })
      setDts(d)
    }
  }, [tableColumnsData])

  const performColumnSearch = (e: React.FormEvent, i: number, key: string) => {
    let elm = e.currentTarget as HTMLInputElement
    setTableColumnSearchFields((prev: any) => ({
      ...prev,
      [key]: elm.value
    }))
    dts.columns(i).search(elm.value).draw()
  }
  return (
    <Box overflow={'auto'}>
      {refresh && (
        <Flex w="100%" justifyContent="flex-end">
          <Button
            ml="4"
            mb="1"
            bgColor={'cyan.50'}
            borderWidth="1px"
            borderColor="cyan.100"
            color="cyan.800"
            onClick={() => {
              refreshCallback()
            }}>
            Refresh
          </Button>
        </Flex>
      )}
      {data && data.length === 0 && (
        <GrayBox props={{mt: 20, p: 10}}>
          <Flex w={'100%'} align="center" justifyContent={'center'}>
            <Heading>No Data</Heading>
          </Flex>
        </GrayBox>
      )}
      {colSearch && data && data.length > 0 && colSearchRender && (
        <>
          <Flex w={tableWidth}>
            {tableColumnSearchFields &&
              tableColumnsData &&
              tableColumnsData.length > 0 &&
              Object.keys(tableColumnSearchFields).length > 0 &&
              tableColumnsData.map((obj: any, i) => (
                <React.Fragment key={`title_${obj.title}_${i}`}>
                  <Input
                    type="text"
                    px="4px"
                    py="4px"
                    height="auto"
                    borderRadius="6px"
                    borderLeftWidth="0"
                    fontSize={'12px'}
                    borderColor="gray.200"
                    boxSizing="border-box"
                    w={colsWidth[i] + 'px'}
                    placeholder={obj.title}
                    value={tableColumnSearchFields[obj.title]}
                    onChange={e => {
                      performColumnSearch(e, i, obj.title)
                    }}
                  />
                </React.Fragment>
              ))}
          </Flex>
        </>
      )}
      {data && data.length > 0 && (
        <table
          style={{backgroundColor: 'white'}}
          ref={tableRef}
          className="display"
          onClick={(e: any) => {
            if (callBack) {
              if (e.target.tagName === 'TH') {
                setColSearchRender(colSearchRender + 1)
              }

              callBack(e)
            }
          }}></table>
      )}
    </Box>
  )
}
