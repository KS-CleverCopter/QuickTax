import { Box, FormControl, Select } from "@chakra-ui/react";
import { FormEvent, useEffect, useState } from "react";
import { Loader } from "../components/CommomComponents/loader";
import { CCDataTable } from "../components/dataTable";
import { Header } from "./header";

export const ProcessedData = () => {
  const [filteredRowData, setFilteredRowData] = useState<any>([]);
  const [dataType, setDataType] = useState<string>("type1");

  

  const updateForm = (e: FormEvent) => {
    let elm = e.target as HTMLSelectElement;
    setDataType(elm.value);
  };
  const [dataLoading, setDataLoading] = useState<boolean>(false)

  // When the selectBox is changed this function gets called
  const loadTableData = () => {
    fetch(`${process.env.REACT_APP_API_HOST}/view.php?req=` + dataType)
      .then((res) => res.json())
      .then((data: any) => {
        if (data.status !== "Failed") {
          let columns: any = [];
          if (data.data.length > 0) {
            Object.keys(data.data[0]).forEach((key) => {
              columns.push({
                name: key,
                selector: (row: any) => row[key],
                sortable: true,
                grow: 2,
              });
            });
            setFilteredRowData(data.data);
          }
        }
        setDataLoading(false)
      });
  }
  useEffect(() => {
    loadTableData()
  }, [dataType]);
  return (
    <>
      <Header selectedMenu="/processedData" />
      {dataLoading && <Loader />}
      <FormControl w="200px" mr="4" m='4'>
        <Select
          value={dataType}
          isRequired={true}
          onChange={(e) => {
            updateForm(e);
          }}
        >
          <option value="type1" defaultValue="True">Futuro</option>
          <option value="type2">Vista, Termo, De opções, Lucro, Prejuízo</option>
          <option value="nova_movi">NovaMovimento Form</option>
        </Select>
      </FormControl>
      <Box m="4">
        <CCDataTable
          data={filteredRowData}
          exportButtons={true}
          refresh={true}
          colSearch={true}
          refreshCallback={() => {
            setDataLoading(true)
            loadTableData()
          }}
        />
      </Box>
    </>
  );
};
