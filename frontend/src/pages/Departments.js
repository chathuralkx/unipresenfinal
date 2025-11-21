import React from 'react';
import './Departments.css';

const Departments = () => {
  // Add your department data here with links
  const departments = [
    {
      id: 1,
      name: 'Computer Science',
      description: 'Department of Computer Science and Engineering',
      website: 'https://eng.pdn.ac.lk/computer/',
      email: 'cse@eng.pdn.ac.lk',
      phone: '+94 81 2393470',
      icon: '💻'
    },
    {
      id: 2,
      name: 'Engineering',
      description: 'Faculty of Engineering',
      website: 'https://eng.pdn.ac.lk/',
      email: 'engineering@pdn.ac.lk',
      phone: '+94 81 2393400',
      icon: '⚙️'
    },
    {
      id: 3,
      name: 'Mathematics',
      description: 'Department of Mathematics',
      website: 'https://sci.pdn.ac.lk/mathematics/',
      email: 'math@sci.pdn.ac.lk',
      phone: '+94 81 2392100',
      icon: '📐'
    },
    {
      id: 4,
      name: 'Physics',
      description: 'Department of Physics',
      website: 'https://sci.pdn.ac.lk/physics/',
      email: 'physics@sci.pdn.ac.lk',
      phone: '+94 81 2392200',
      icon: '🔬'
    },
    // Add more departments as needed
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