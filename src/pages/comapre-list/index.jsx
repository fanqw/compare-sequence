import { Button, Modal, Table, Tooltip } from 'antd';
import { diffChars } from 'diff';
import React, { useState } from 'react';
import './index.css';
const ExcelJS = require('exceljs');

function ComapreList ({ originContent, data, setShowTable, setData }) {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visible, setVisible] = useState(false);
  const columns = [
    {
      title: '匹配率',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
    },
    {
      title: '原序列起点',
      dataIndex: 'originStart',
      key: 'originStart',
      width: 120,
    },
    {
      title: '原序列终点',
      dataIndex: 'originEnd',
      key: 'originEnd',
      width: 120,
    },
    {
      title: '原序列片段',
      dataIndex: 'originValue',
      key: 'originValue',
      render: (value) => value.length > 30 ? <Tooltip title={value}>{value.slice(0, 30)}...</Tooltip> : value,
    },
    {
      title: '对比序列起点',
      dataIndex: 'targetStart',
      key: 'targetStart',
      width: 120,
    },
    {
      title: '对比序列终点',
      dataIndex: 'targetEnd',
      key: 'targetEnd',
      width: 120,
    },
    {
      title: '对比序列片段',
      dataIndex: 'targetValue',
      key: 'targetValue',
      render: (value) => value.length > 30 ? <Tooltip title={value}>{value.slice(0, 30)}...</Tooltip> : value,
    },
  ];

  const rowSelection = {
    type: 'checkbox',
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
  };

  const hasSelected = selectedRowKeys.length > 0;

  const handleExportCSV = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet();
    worksheet.addRows(
      selectedRows.map((item) => [
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

  const show = () => {
    let originLocation = [];
    let targetLocation = [];
    for (let index = 0; index < selectedRows.length; index++) {
      const element = selectedRows[index];
      const targetText = `${originContent.slice(0, element.originStart - 1)}${element.targetValue}${originContent.slice(element.originEnd, originContent.length)}`
      const compare = diffChars(originContent, targetText);
      let origin = ''
      let location = []
      compare.forEach(item => {
        if (item.added) {
          originLocation.push({
            key: element.key,
            index: origin.length - 1,
            value: new Array(item.count).fill(' ').join(''),
            fill: true,
          })
          location.push({
            index: origin.length - 1,
            value: item.value,
            fill: true,
          })
        } else if(item.removed) {
          origin = `${origin}${item.value}`;
          originLocation.push({
            key: element.key,
            index: origin.length - 1,
            value: item.value,
            isChange: true,
          })
          location.push({
            index: origin.length - 1,
            value: new Array(item.count).fill(' ').join(''),
            isChange: true,
          })
        } else  {
          origin = `${origin}${item.value}`;
        }
      })
      targetLocation.push({
        key: element.key,
        beforeFill: element.originStart,
        afterFill: element.originEnd,
        targetText,
        location,
      });
    }
  
    const format = (location, beforeFill, afterFill, _index) => {
      let strArr = originContent.split('');
      let formatStr = '';
      formatStr = strArr.reduce((acc, cur, index) => {
        const find = location.find(item => item.index === index) || {};
        let value = '';
        if (index < beforeFill - 1) {
          cur = '.'
          value = new Array(find?.value?.length || 0).fill('.').join('')
        }
         else if(index > afterFill - 1){
          cur = '.'
          value = new Array(find?.value?.length || 0).fill('.').join('')
        } 
        else {
          value = find.value;
        }
        const values = value ? value.split('').map(item => `<div style=" width: 12px; padding: 0 4px; text-align: center ">${item}</div>`).join('') : '';
        if (find.isChange) {
          acc = `${acc}${values}`;
        } else if (find.fill) {
          acc = `${acc}<div style="background-color: #1890ff; width: 12px; padding: 0 4px; text-align: center">${cur}</div>${values}`
        } else {
          acc = `${acc}<div style="background-color: #1890ff; width: 12px; padding: 0 4px; text-align: center">${cur}</div>`
        }
        return acc;
      }, formatStr)
      return formatStr
    }
  
    // console.log('originLocation', originLocation);
    // console.log('targetLocation', targetLocation);
    const originText = format(originLocation);
    const targetTexts = targetLocation.map((item, index) => {
      let { location } = item;
      const filter = originLocation.filter(ele => ele.key !== item.key);
      location =  location.concat(filter).sort((a, b) => a.index - b.index);
      
      location = location.reduce((acc, cur, index) => {
        if (index === 0) {
          acc.push(cur);
          return acc;
        }
        const last = acc.pop();
        if (last.index !== cur.index) {
          acc.push(last, cur);
          return acc;
        }
        const value = [last.value, cur.value].map(val => {
          if (val.includes(' ')) {
            return val.slice(0, val.length - 1);
          }
          return val;
        }).join('');
        acc.push({
          ...last,
          value,
          isChange: true,
        })
        return acc;
      }, [])
  
  
      console.log('location===', location);
      // const arr = _.cloneDeep(originLocation);
      return format(location , item.beforeFill, item.afterFill, index)
  
    });

    const len = 20 * originContent.length;
    
    return (
      <div style={{ marginTop: '20px' }}>
        <div dangerouslySetInnerHTML={{ __html: `<div class='compareList-modal-item' style="width: ${len}px">${originText}</div>`}}></div>
        {
          targetTexts.map(item => <div dangerouslySetInnerHTML={{ __html: `<div class='compareList-modal-item' style="width: ${len}px">${item}</div>`}}></div>)
        }
      </div>
    )
  }

  return (
    <div>
      <div className='compareList-btnContainer'>
        <Button
          className='compareList-btn'
          type='primary'
          onClick={() => {
            setShowTable(false)
            setData([])
          }}
        >
          重新上传
        </Button>
        <Button
          className='compareList-btn'
          type='primary'
          disabled={!hasSelected}
          onClick={() => handleExportCSV()}
        >
          导出文件
        </Button>
        <Button
          className='compareList-btn'
          type='primary'
          disabled={!hasSelected}
          onClick={() => setVisible(true)}
        >
          对比结果
        </Button>
      </div>
      <Table 
        columns={columns}
        rowSelection={rowSelection}
        dataSource={data}
        // dataSource={[{
        //   key: 1,
        //   originStart: 32,
        //   originEnd: 32,
        //   originValue: 'TGCTTTCTTTTTCATCGCTAGGTGGGGTAATATCATACATAGGATCGTGTGGGGGCTCTCCCAACCGCACCAGCCCCGTGTCCATGTACAGTGAGAACTCCAACAGCAGCCTGCAGTCCTTTACGCAACCCTGCTTTGGTTCTTCATTTCCACCA',
        //   targetStart: 187,
        //   targetEnd: 187,
        //   targetValue: 'TGCTTTCTTTTTCATCGCTAGGTGGGGTAATATCATACATAGGATCGTGTGGGGGCTCTCCCAACCGCACCAGCCCCGTGTCCATGTACAGTGAGAACTCCAACAGCAGCCTGCAGTCCTTTACGCAACCCTGCTTTGGTTCTTCATTTCCACCA',
        // }]}
      />
      <Modal
        title="对比结果"
        centered
        open={visible}
        onCancel={() => setVisible(false)}
        width={1000}
        footer={null}
      >
        <div className='compareList-modal'>
          {show()}
        </div>
      </Modal>
    </div>
  )
}

export default ComapreList;