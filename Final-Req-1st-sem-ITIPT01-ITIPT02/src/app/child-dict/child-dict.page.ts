import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonItem, IonSelect, IonSelectOption, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonBadge, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personAddOutline, personOutline, createOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-child-dict',
  templateUrl: './child-dict.page.html',
  styleUrls: ['./child-dict.page.scss'],
  imports: [CommonModule, FormsModule, HttpClientModule,IonHeader, RouterLink, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonItem, IonSelect, IonSelectOption, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonBadge],})

export class ChildDictPage implements OnInit {
    searchTerm: string = '';
    selectedPurok: string = '';
    
    childrenList: any[] = [];
    filteredChildren: any[] = [];

    private pressTimer: any = null;
    private isLongPressTriggered: boolean = false;


  constructor(
    private router: Router, 
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ 
      'arrow-back-outline': arrowBackOutline, 
      'person-add-outline': personAddOutline, 
      'person-outline': personOutline, 
      'create-outline': createOutline, 
      'trash-outline': trashOutline 
    });
  }

  ngOnInit(): void {
     this.fetchChildren();
  }

  ionViewWillEnter(): void {
    this.fetchChildren();
  }

  fetchChildren(): void {
    this.http.get<any>('http://localhost:8000/api/children').subscribe({
      next: (res) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.childrenList = res.data.map((item: any) => ({
            id: item.id,
            fullName: item.name,
            ageMonths: item.age,
            purok: item.purok,
            weightKg: item.weight,
            heightCm: item.height,
            nutritionalStatus: item.nutritional_status
          }));
        } else {
          this.childrenList = [];
        }
        
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error:', err);
      }
    });
  }

  applyFilter(): void {
    this.filteredChildren = this.childrenList.filter(child => {
      const searchVal = this.searchTerm ? this.searchTerm.trim().toLowerCase() : '';
      const matchName = searchVal 
        ? (child.fullName && child.fullName.toLowerCase().includes(searchVal)) 
        : true;
        
      const matchPurok = this.selectedPurok 
        ? (child.purok === this.selectedPurok) 
        : true;
        
      return matchName && matchPurok;
    });
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'Normal': return 'success';
      case 'Underweight': return 'warning';
      case 'Severely Underweight': return 'danger';
      default: return 'medium';
    }
  }

  addChild(): void {
    this.router.navigate(['/add-child']);
  }

  editChild(child: any): void {
    this.router.navigate(['/add-child'], { 
      queryParams: { id: child.id, editMode: true } 
    });
  }

  onItemClick(child: any): void {
    if (this.isLongPressTriggered) {
      this.isLongPressTriggered = false;
      return;
    }
    this.editChild(child);
  }

  startLongPress(child: any): void {
    this.isLongPressTriggered = false;
    this.pressTimer = setTimeout(() => {
      this.isLongPressTriggered = true;
      this.confirmDelete(child);
    }, 600);
  }

  cancelLongPress(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  async confirmDelete(child: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to archive ${child.fullName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Yes, Archive',
          handler: () => {
            this.executeDelete(child.id);
          }
        }
      ]
    });

    await alert.present();
  }

  executeDelete(childId: number): void {
    this.http.put<any>(`http://localhost:8000/api/children/${childId}/archive`, {}).subscribe({
      next: async (response) => {
        const toast = await this.toastController.create({
          message: 'Successfully deleted to archive.',
          duration: 4000,
          position: 'bottom',
          color: 'success',
          mode: 'ios',
          buttons: [
            {
              text: 'View',
              role: 'info',
              handler: () => {
                this.router.navigate(['/archive-records']);
              }
            }
          ]
        });
        await toast.present();

        this.fetchChildren();
      },
      error: (err) => {
        console.error('Error archiving child:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-home']);
  }
}
