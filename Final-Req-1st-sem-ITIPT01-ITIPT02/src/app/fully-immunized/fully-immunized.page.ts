import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonBadge } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, shieldCheckmarkOutline } from 'ionicons/icons';

interface ImmunizedChild {
  id: number;
  fullName: string;
  ageMonths: number;
  purok: string;
  lastVaccine?: string;
  dateCompleted?: string;
}

@Component({
  selector: 'app-fully-immunized',
  templateUrl: './fully-immunized.page.html',
  styleUrls: ['./fully-immunized.page.scss'],
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonBadge]
})
export class FullyImmunizedPage implements OnInit {
  searchTerm: string = '';
  immunizedList: ImmunizedChild[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    addIcons({ 'arrow-back-outline': arrowBackOutline, 'shield-checkmark-outline': shieldCheckmarkOutline });
  }

  ngOnInit() {
    this.fetchFullyImmunizedChildren();
  }

  fetchFullyImmunizedChildren() {
    fetch('http://localhost:8000/api/children/fully-immunized')
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          this.immunizedList = response.data.map((child: any) => ({
            id: child.id,
            fullName: child.name,         
            ageMonths: child.age,          
            purok: child.purok,            
            lastVaccine: 'Complete',       
            dateCompleted: 'Verified'
          }));
          this.cdr.detectChanges();
        }
      })
      .catch(err => console.error('Error fetching fully immunized children:', err));
  }

  get filteredImmunizedList() {
    return this.immunizedList.filter(child =>
      child.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      child.purok.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  viewChildVaccineRecord(child: ImmunizedChild): void {
    this.router.navigate(['/vaccine'], {
      state: { childId: child.id, isViewOnly: true }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-home']);
  }
}