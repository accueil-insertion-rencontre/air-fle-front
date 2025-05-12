import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-home">
      <div class="welcome-card">
        <h2>Bienvenue sur le Dashboard</h2>
        <p>Sélectionnez une option dans le menu pour commencer.</p>
      </div>
      
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">👨‍🎓</div>
          <div class="stat-content">
            <h3>Apprenants</h3>
            <div class="stat-value">124</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>Utilisateurs</h3>
            <div class="stat-value">32</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h3>Examens</h3>
            <div class="stat-value">56</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <h3>Périodes</h3>
            <div class="stat-value">8</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-home {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .welcome-card {
      background-color: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    }
    
    .welcome-card h2 {
      color: #2d3748;
      margin-top: 0;
      margin-bottom: 10px;
    }
    
    .welcome-card p {
      color: #718096;
      margin: 0;
    }
    
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .stat-card {
      background-color: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.12);
    }
    
    .stat-icon {
      font-size: 2.5rem;
      margin-right: 15px;
    }
    
    .stat-content {
      flex: 1;
    }
    
    .stat-content h3 {
      color: #718096;
      font-size: 0.9rem;
      margin: 0 0 5px 0;
      font-weight: 500;
    }
    
    .stat-value {
      color: #2d3748;
      font-size: 1.8rem;
      font-weight: 600;
    }
    
    @media (max-width: 768px) {
      .stats-container {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }
      
      .stat-icon {
        font-size: 2rem;
        margin-right: 10px;
      }
      
      .stat-value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class HomeComponent {} 