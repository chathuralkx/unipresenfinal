import React from 'react';
import './Departments.css';

const Departments = () => {
  // Add your department data here with links
  const departments = [
    {
      id: 1,
      name: 'Botany',
      description: 'Department of Botany',
      website: 'https://sci.pdn.ac.lk/botany/',
      email: 'botany@pdn.ac.lk',
      phone: '+94 81 239 4580',
      icon: '🌿'
    },
    {
      id: 2,
      name: 'Chemistry',
      description: 'Department of Chemistry',
      website: 'https://sci.pdn.ac.lk/chemistry/',
      email: 'headchem@sci.pdn.ac.lk',
      phone: '+94 81 239 4420',
      icon: '⚗️'
    },
    {
      id: 3,
      name: 'Environmental and  Industrial Sciences',
      description: 'Department of Environmental and  Industrial Sciences',
      website: 'https://sci.pdn.ac.lk/eis/',
      email: 'headeis@sci.pdn.ac.lk',
      phone: '+94 81 239 4646',
      icon: '🏭'
    },
    {
      id: 4,
      name: 'Geology',
      description: 'Department of Geology',
      website: 'https://sci.pdn.ac.lk/geology/',
      email: 'geology@pdn.ac.lk',
      phone: '+94 81 239 4200',
      icon: '🪨'
    },
    {
      id: 5,
      name: 'Mathematics',
      description: 'Department of Mathematics',
      website: 'https://sci.pdn.ac.lk/maths/',
      email: 'maths@pdn.ac.lk',
      phone: '+94 81 239 4551',
      icon: '📐'
    },
    {
      id: 6,
      name: 'Molecular Biology and Biotechnology',
      description: 'Department of Molecular Biology and Biotechnology',
      website: 'https://sci.pdn.ac.lk/molecular/',
      email: 'sanathr@pdn.ac.lk',
      phone: ' +94 81 239 4406',
      icon: '🧬'
    },
    {
      id: 7,
      name: 'Physics',
      description: 'Department of Physics',
      website: 'https://sci.pdn.ac.lk/physics/',
      email: 'sphysics@pdn.ac.lk',
      phone: ' +94 81 239 4580',
      icon: '🔭'
    },
    {
      id: 8,
      name: 'Statistics and Computer Science',
      description: 'Department of Statistics and Computer Science',
      website: 'https://sci.pdn.ac.lk/scs/',
      email: 'headscs@sci.pdn.ac.lk',
      phone: ' +94 81 239 4251',
      icon: '💻'
    },
    {
      id: 9,
      name: 'Zoology',
      description: 'Department of Zoologyy',
      website: 'https://sci.pdn.ac.lk/zoology/',
      email: 'hdzoology@pdn.ac.lk',
      phone: ' +94 81 239 4471',
      icon: '🦁'
    },
    
  ];

  const handleVisitWebsite = (website) => {
    window.open(website, '_blank');
  };

  return (
    <div className="departments-page">
      <div className="departments-header">
        <h1>Academic Departments</h1>
        <p>Explore our departments and visit their official websites</p>
      </div>

      <div className="departments-grid">
        {departments.map((dept) => (
          <div key={dept.id} className="department-card">
            <div className="dept-icon">{dept.icon}</div>
            
            <div className="dept-content">
              <h2>{dept.name}</h2>
              <p className="dept-description">{dept.description}</p>
              
              <div className="dept-info">
                <div className="info-item">
                  <span className="info-label">📧 Email:</span>
                  <a href={`mailto:${dept.email}`} className="info-value">
                    {dept.email}
                  </a>
                </div>
                
                <div className="info-item">
                  <span className="info-label">📞 Phone:</span>
                  <span className="info-value">{dept.phone}</span>
                </div>
              </div>
            </div>

            <button 
              className="visit-website-btn"
              onClick={() => handleVisitWebsite(dept.website)}
            >
              Visit Website →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Departments;