import React, { useState } from 'react';
import './App.css';
import CompareList from './pages/comapre-list';
import UploadFile from './pages/upload-file';

function App() {
  const [showTable, setShowTable] = useState(false);
  const [originContent, setOriginContent] = useState('');
  const [data, setData] = useState([]);
  return (
    <div className='app'>
      <div className='app-title'>对比序列v0.2</div>
      <div className='app-content'>
        {!showTable ? (
          <UploadFile
            originContent={originContent}
            setShowTable={setShowTable}
            setOriginContent={setOriginContent}
            setData={setData}
          />
          ) : (
            <CompareList
            data={data}
            originContent={originContent}
            setShowTable={setShowTable}
            setData={setData}
          />
        )}
      </div>
    </div>
  );
}

// const origin =
//   'ATGCAGCGAAGAGGGAGCAATCTAGTAAGTGTGCTTTTCTTTTTCATCGCTAGGTGGGGTAATATCATACATAGGATCGTGTGGGGGCTCTCCCAACCGCACCAGCCCCGTGTCCATGTACAGTGAGAACTCCAACAGCAGCCTGCAGTCCTTTACGCAACCCTGCTTTGGTTCTTCATTTCCACCATCCCCCAATGGATCGCATGATTCCTCTCGCATGTACACCAGCAGCAGCAGCAGCTCGAGTTCTGGATCAGGAGAGGAGGGAAACTCATCATGCTCTAGTGGATCCCCAAGAGGCCGTGATGATGGTGGAAGTGCACGCAATTCACCCAACAAATCAGTTGCCACCCTTACTAGTAAGTGATAAGAACCATACCTGATTAATGTAGAGTATGGCATCCAGGAGAACGATTATTATAACATCTAACTTTCCATCCAGAGCTGAATGGAATGGTGTTGCTGTGCAAAGTGTGTGGCGATGTGGCTTCCGGTTTTCACTATGGTGTCCATGCCTGTGAGGGCTGCAAGGTAATTAAATAGCATCTGTTTATATTTGCAAGAGTTTAATATACATTTTACTTCTTAATTAAAGCTTTTGTTTAAACAAAATTTACATTTACGTTATCTGCATTGTCCACAGGGTTTCTTTCGACGCAGCATCCAGCAGAACATTCAGTACAAAAAGTGCCTGAAGAATGAAACTTGTACCATTATGAGGATCAACCGAACCGGTGCCAGCAGTGCCGTTTCAAAAAGTGTCTGTCTGTGGGAATGTCCCGAGACGGTGA';

export default App;
