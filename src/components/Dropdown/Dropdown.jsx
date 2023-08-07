import React, { useState } from 'react';
import './dropdown.css'
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

const Dropdown = ({ title, listItems }) => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(!open);
    };

  return (
    <div className='dd-wrapper'>
        <div className='dd-header' onClick={handleOpen} >
            <ArrowRightIcon className={open ? 'arrow down' : 'arrow up'} />
            <div className='dd-header-title'>{title}</div>
        </div>

        {open ? 
            <div className='dd-list'>
                <ul className='dd-list-item-container'>
                    {listItems?.map((item, i) => (
                        <li key={i} className='dd-list-item'>{item}</li>
                    ))}
                </ul>
            </div>
        : null} 
    </div>
  );
};

export default Dropdown;