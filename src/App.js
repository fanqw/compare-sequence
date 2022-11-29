import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Upload } from 'antd';
import React from 'react';
// import { Route, Routes } from 'react-router-dom';
import './App.css';
const ExcelJS = require('exceljs');

// function App() {
//   return (
//     <Routes>
//       {/* 页面默认导航到 Home 组件(页面上显示 Home Compontent) */}
//       <Route path='/' element={<Home />} />
//     </Routes>
//   );
// }
const origin =
  'ATGCAGCGAAGAGGGAGCAATCTAGTAAGTGTGCTTTTCTTTTTCATCGCTAGGTGGGGTAATATCATACATAGGATCGTGTGGGGGCTCTCCCAACCGCACCAGCCCCGTGTCCATGTACAGTGAGAACTCCAACAGCAGCCTGCAGTCCTTTACGCAACCCTGCTTTGGTTCTTCATTTCCACCATCCCCCAATGGATCGCATGATTCCTCTCGCATGTACACCAGCAGCAGCAGCAGCTCGAGTTCTGGATCAGGAGAGGAGGGAAACTCATCATGCTCTAGTGGATCCCCAAGAGGCCGTGATGATGGTGGAAGTGCACGCAATTCACCCAACAAATCAGTTGCCACCCTTACTAGTAAGTGATAAGAACCATACCTGATTAATGTAGAGTATGGCATCCAGGAGAACGATTATTATAACATCTAACTTTCCATCCAGAGCTGAATGGAATGGTGTTGCTGTGCAAAGTGTGTGGCGATGTGGCTTCCGGTTTTCACTATGGTGTCCATGCCTGTGAGGGCTGCAAGGTAATTAAATAGCATCTGTTTATATTTGCAAGAGTTTAATATACATTTTACTTCTTAATTAAAGCTTTTGTTTAAACAAAATTTACATTTACGTTATCTGCATTGTCCACAGGGTTTCTTTCGACGCAGCATCCAGCAGAACATTCAGTACAAAAAGTGCCTGAAGAATGAAACTTGTACCATTATGAGGATCAACCGAACCGGTGCCAGCAGTGCCGTTTCAAAAAGTGTCTGTCTGTGGGAATGTCCCGAGACGGTGA';

const writeFile = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet();
  worksheet.addRows(
    data.map((item) => [
      item.rate,
      item.originStart,
      item.originEnd,
      item.originValue,
      item.targetStart,
      item.targetEnd,
      item.targetValue,
    ])
  );
  const buffer = await workbook.csv.writeBuffer();
  const file = new File([buffer], { type: 'text/csv' });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compare.csv';
  a.click();
};

function App() {
  const onFinish = async (values) => {
    const { csv, txt, origin } = values;
    const originData = await csv2Arr(csv.file);
    const targetArr = await txt2Arr(txt.file);
    const targetMap = {};
    for (const item of targetArr) {
      targetMap[item.targetKey] = item.targetValue;
    }
    const result = originData.map((item) => ({
      ...item,
      originValue: origin.slice(item.originStart, item.originEnd),
      targetValue:
        targetMap[`${item.targetStart}-${item.targetEnd}`] || targetMap[`${item.targetEnd}-${item.targetStart}`],
    }));

    writeFile(result);
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const csv2Arr = async (file) =>
    new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.readAsBinaryString(file);
      let arr = [];
      fileReader.onload = (event) => {
        const binaryStr = event.target.result || '';
        arr = binaryStr
          .split('\n')
          .filter((item) => item && !item.includes('100.000'))
          .map((item) => {
            const data = item.split(',');
            const originStart = parseInt(data[6]) < parseInt(data[7]) ? parseInt(data[6]) : parseInt(data[7]);
            const originEnd = parseInt(data[6]) < parseInt(data[7]) ? parseInt(data[7]) : parseInt(data[6]);
            const targetStart = parseInt(data[8]) < parseInt(data[9]) ? parseInt(data[8]) : parseInt(data[9]);
            const targetEnd = parseInt(data[8]) < parseInt(data[9]) ? parseInt(data[9]) : parseInt(data[8]);
            return {
              rate: data[2],
              originStart,
              originEnd,
              targetStart,
              targetEnd,
            };
          });
        return resolve(arr);
      };
    });

  const txt2Arr = async (file) =>
    new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.readAsText(file);
      let arr = [];
      fileReader.onload = (event) => {
        const str = event.target.result || '';
        const strArr = str.split('\n');
        arr = strArr.reduce((acc, cur) => {
          if (cur.includes(':')) {
            const targetKey = cur.split(':')[1];
            acc.push({
              targetKey,
            });
            return acc;
          }
          const last = acc.pop();
          last.targetValue = `${last.targetValue || ''}${cur}`;
          acc.push(last);
          return acc;
        }, []);
        return resolve(arr);
      };
    });

  const csvProps = {
    name: 'csv',
    accept: 'text/csv',
    beforeUpload: (file) => {
      const isCSV = file.type === 'text/csv';
      if (!isCSV) {
        message.error(`${file.name} 不是csv文件`);
      }
      return false;
    },
  };

  const txtProps = {
    name: 'txt',
    accept: 'text/plain',
    beforeUpload: (file) => {
      txt2Arr(file);
      const isTXT = file.type === 'text/plain';
      if (!isTXT) {
        message.error(`${file.name} 不是txt文件`);
      }
      return false;
    },
  };
  return (
    <div className='App'>
      <div className='title'>范钦旺的大饼V0.0.1</div>
      <div className='card'>
        <Form
          name='basic'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          layout='horizontal'
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item label='请上传CSV' name='csv' rules={[{ required: true, message: '请上传CSV!' }]}>
            <Upload {...csvProps}>
              <Button icon={<UploadOutlined />}>上传</Button>
            </Upload>
          </Form.Item>

          <Form.Item label='请上传txt' name='txt' rules={[{ required: true, message: '请上传txt!' }]}>
            <Upload {...txtProps}>
              <Button icon={<UploadOutlined />}>上传</Button>
            </Upload>
          </Form.Item>
          <Form.Item label='请输入源序列' name='origin' rules={[{ required: true, message: '请输入源序列!' }]}>
            <Input.TextArea placeholder='请输入源序列' />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
            <Button type='primary' htmlType='submit'>
              提交
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default App;
