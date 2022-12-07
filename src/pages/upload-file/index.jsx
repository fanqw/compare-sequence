import { InboxOutlined } from '@ant-design/icons';
import { Button, Input, message, Steps, Upload } from 'antd';
import React, { useState } from 'react';
import './index.css';
const { Dragger } = Upload;

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
          const anomaly = parseInt(data[8]) > parseInt(data[9])
          return {
            key: `${originStart}-${originEnd}-${targetStart}-${targetEnd}`,
            anomaly,
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

function UploadFile({ originContent, setOriginContent, setShowTable, setData }) {
  const [current, setCurrent] = useState(0);
  const [csvFile, setCsvFile] = useState();
  const [txtFile, setTxtFile] = useState();
  
  const csvProps = {
    name: 'csv',
    multiple: false,
    accept: 'text/csv',
    fileList: csvFile ? [csvFile] : [],
    beforeUpload: (file) => {
      const isCSV = file.type === 'text/csv';
      if (!isCSV) {
        message.error(`${file.name} 不是csv文件`);
      }
      return false;
    },
    onChange(info) {
      if (info?.file?.status) {
        setCsvFile()
      } else {
        setCsvFile(info?.file)
      }
    },
  };

  const txtProps = {
    name: 'txt',
    multiple: false,
    accept: 'text/plain',
    fileList: txtFile ? [txtFile] : [],
    beforeUpload: (file) => {
      txt2Arr(file);
      const isTXT = file.type === 'text/plain';
      if (!isTXT) {
        message.error(`${file.name} 不是txt文件`);
      }
      return false;
    },
    onChange(info) {
      if (info?.file?.status) {
        setTxtFile()
      } else {
        setTxtFile(info?.file)
      }
    },
  };

  const createDragger = (props) => (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽文件至当前区域上传</p>
    </Dragger>
  );

  const handlePrevStep = () => setCurrent(current - 1);
  const handleNextStep = () => {
    if (current === 0 && !csvFile) {
      message.warning("请上传CSV")
      return
    }
    if (current === 1 && !txtFile) {
      message.warning("请上传TXT")
      return
    }
    setCurrent(current + 1)
  };
  const handleSubmit = async () => {
    if (!originContent) {
      message.warning("请输入原序列")
      return
    }
    const originData = await csv2Arr(csvFile);
    const targetArr = await txt2Arr(txtFile);
    const targetMap = {};
    for (const item of targetArr) {
      targetMap[item.targetKey] = item.targetValue;
    }
    const result = originData.map((item) => ({
      ...item,
      originValue: originContent.slice(item.originStart - 1, item.originEnd),
      targetValue:
        targetMap[`${item.targetStart}-${item.targetEnd}`] || targetMap[`${item.targetEnd}-${item.targetStart}`],
    }));

    // console.log('result', result);
    // writeFile(result);
    setShowTable(true);
    setData(result)
  }
  const showPrev = current > 0;
  const showNext = current < 2;
  const showResult = current === 2;

  return (
    <div className='upload-file'>
      <Steps
        current={current}
        items={[
        { title: '上传CSV' },
        { title: '上传TXT' },
        { title: '输入原序列' }
      ]}
    />
      <div className='content'>
        {current === 0 && createDragger(csvProps)}
        {current === 1 && createDragger(txtProps)}
        {current === 2 && (
          <Input.TextArea value={originContent} onChange={(e) => setOriginContent(e.target.value)} rows={6} placeholder='请输入原序列' />
        )}  
      </div>
      <div className='btn-group'>
        {showPrev &&  <Button onClick={() => handlePrevStep()}>上一步</Button>}
        {showNext &&  <Button type="primary" onClick={()=> handleNextStep()}>下一步</Button>}
        {showResult && <Button type="primary" onClick={() => handleSubmit()}>查看结果</Button>}  
      </div>
    </div>
  );
}

export default UploadFile;

