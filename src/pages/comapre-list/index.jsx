import { DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Table, Tooltip } from 'antd';
import { diffChars } from 'diff';
import html2canvas from "html2canvas";
import React, { useRef, useState } from 'react';
import './index.css';
const ExcelJS = require('exceljs');

function ComapreList ({ originContent, data, setShowTable, setData }) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const compare = useRef();

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
    selectedRowKeys: selectedRows.map(item => item.key),
    onChange: (_, selectedRows) => {
      setSelectedRows(selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: record.anomaly, // Column configuration not to be checked
      // name: record.name,
    }),
  };

  const hasSelected = selectedRows.length > 0;

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

  const handleSelectAll = () => {
    if (selectedAll) {
      setSelectedAll(false);
      setSelectedRows([]);
    } else {
      const rows = []
      for (const item of data) {
        if (!item.anomaly) {
          rows.push(item);
        }
      }
      setSelectedAll(true);
      setSelectedRows(rows);
    }
  }

  const handleDownload = () => {
    setLoading(true)
    html2canvas(compare.current, {
      allowTaint: false, 
      useCORS: true, // 允许跨域
      tainttest: true, // 检测每张图片都已经加载完成
      logging: true,
      backgroundColor: `rgb(255,255,255)`, // 转换图片可能会有白色底色，你可根据你的页面或者PM要求设置一下背景色，不要的话就null
    }).then((canvas) => {
      //  转成图片，生成图片地址
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compare';
        a.click();
        setLoading(false)
      })
    });
  }

  const anomalyCount = data.length - selectedRows.length;

  const show = () => {
    // console.log('selectedRows', selectedRows);
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
            key: element.key,
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
            key: element.key,
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
        if (index < beforeFill - 2) {
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
          acc = `${acc}<div style="background-color: rgb(45, 183, 245); width: 12px; padding: 0 4px; text-align: center">${cur}</div>${values}`
        } else {
          acc = `${acc}<div style="background-color: rgb(45, 183, 245); width: 12px; padding: 0 4px; text-align: center">${cur}</div>`
        }
        return acc;
      }, formatStr)
      return formatStr
    }
  
    // originLocation = originLocation.reduce((acc, cur, index) => {
    //   if (index === 0) {
    //     acc.push(cur);
    //     return acc;
    //   }
    //   const last = acc.pop();
    //   if (last.index !== cur.index) {
    //     acc.push(last, cur);
    //     return acc;
    //   }
    //   const value = [last.value, cur.value].map(val => {
    //     if (val && val.trim() === '') {
    //       return val.slice(0, val.length - 1);
    //     }
    //     return val;
    //   }).join('');
    //   acc.push({
    //     ...last,
    //     value,
    //     isChange: true,
    //   })
    //   return acc;
    // }, [])

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
        if(last.index === cur.index && last.key !== cur.key ) {
          acc.push(last);
          return acc;
        }
        if (last.index !== cur.index) {
          acc.push(last, cur);
          return acc;
        }
        const value = [last.value, cur.value].map(val => {
          if (val && val.trim() === '') {
            return val.slice(0, val.length - 1);
          }
          return val;
        }).join('');
        acc.push({
          // ...last,
          key: last.key,
          index: last.index,
          value,
          isChange: true,
        })
        return acc;
      }, [])
  
      // console.log('location===', location);
      // const arr = _.cloneDeep(originLocation);
      return {
        key: item.key,
        content: format(location , item.beforeFill, item.afterFill, index),
      }
  
    });

    const len = 20 * originContent.length;
    
    return (
      <div ref={compare} style={{ marginTop: '20px' }}>
        <div dangerouslySetInnerHTML={{ __html: `<div class='compareList-modal-item' style="width: ${len}px">${originText}</div>`}}></div>
        {
          targetTexts.map(item => <div dangerouslySetInnerHTML={{ __html: `<div key=${item.key} class='compareList-modal-item' style="width: ${len}px">${item.content}</div>`}}></div>)
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
        {selectedAll && anomalyCount > 0 && <Alert message={`发现${anomalyCount}条数据异常，未加入比对`} showIcon type="warning" />}
      </div>
      <div className='compareList-total'>
        {selectedRows.length === 0 && (
          <span>共 {data.length} 项</span>
        )}
        {selectedRows.length > 0 && (
          <span>已选 <span className='compareList-total-light'>{selectedRows.length}</span> / {data.length} 项</span>
        )}
        <Button type="link" className='compareList-total-btn' onClick={() => handleSelectAll()}>
          {selectedAll ? '取消全选' : '一键全选'}
        </Button>
      </div>
      <Table 
        columns={columns}
        rowSelection={rowSelection}
        dataSource={data}
      />
      <Modal
        title="对比结果"
        centered
        open={visible}
        onCancel={() => setVisible(false)}
        width={1000}
        footer={
          <div className='compareList-modal-footer'>
            <Button icon={<DownloadOutlined />} loading={loading} onClick={() => handleDownload()}>{loading ? '下载中' : '下载'}</Button>
          </div>
        }
      >
        <div className='compareList-modal'>
          {visible && show()}
        </div>
      </Modal>
    </div>
  )
}

export default ComapreList;