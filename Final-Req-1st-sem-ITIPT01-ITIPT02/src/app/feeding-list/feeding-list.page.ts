import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonButton, IonIcon, IonList, IonItem, IonBadge, IonSearchbar 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, nutritionOutline, callOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-feeding-list',
  templateUrl: './feeding-list.page.html',
  styleUrls: ['./feeding-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonList, 
    IonItem, 
    IonBadge,
    IonSearchbar
  ]
})
export class FeedingListPage implements OnInit {
  feedingList: any[] = [];
  filteredFeedingList: any[] = [];
  searchTerm: string = '';

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    addIcons({ 
      'arrow-back-outline': arrowBackOutline, 
      'nutrition-outline': nutritionOutline, 
      'call-outline': callOutline, 
      'person-outline': personOutline 
    });
  }

  ngOnInit() {
    this.fetchFeedingList();
  }

  fetchFeedingList() {
    fetch('http://localhost:8000/api/children')
      .then(response => response.json())
      .then(res => {
        console.log("API Response Data:", res);
        
        if (res.success && res.data) {
          this.feedingList = res.data
            .filter((child: any) => {
              const status = child.nutritional_status ? child.nutritional_status.trim().toLowerCase() : '';
              return status.includes('underweight');
            })
            .map((child: any) => ({
              fullName: child.name,
              ageMonths: child.age,
              purok: child.purok,
              weightKg: child.weight,
              heightCm: child.height,
              nutritionalStatus: child.nutritional_status,
              overallStatus: child.overall_status ? child.overall_status.trim().toLowerCase() : '',
              parentName: child.guardian,
              contactNumber: child.contact
            }));
            
          this.filteredFeedingList = [...this.feedingList];
          console.log("Filtered Feeding List:", this.feedingList);
          
          this.cdr.detectChanges();
        }
      })
      .catch(err => {
        console.error('Error fetching feeding list:', err);
      });
  }

  filterFeedingList() {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredFeedingList = [...this.feedingList];
      this.cdr.detectChanges();
      return;
    }

    this.filteredFeedingList = this.feedingList.filter((child: any) => {
      const matchesName = String(child.fullName).toLowerCase().includes(term);
      const matchesPurok = String(child.purok).toLowerCase().includes(term);
      return matchesName || matchesPurok;
    });

    this.cdr.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/admin-home']);
  }
}