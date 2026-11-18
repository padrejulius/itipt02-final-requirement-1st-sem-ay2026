import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonCard, IonBadge, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, archiveOutline, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'app-archive-records',
  templateUrl: './archive-records.page.html',
  styleUrls: ['./archive-records.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonCard, 
    IonBadge, 
    RouterLink
  ]
})
export class ArchiveRecordsPage implements OnInit {
  archivedChildren: any[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'archive-outline': archiveOutline,
      'refresh-outline': refreshOutline
    });
  }

  ngOnInit(): void {
    this.loadArchivedChildren();
  }

  ionViewWillEnter(): void {
    this.loadArchivedChildren();
  }

  loadArchivedChildren(): void {
    this.http.get<any>('http://localhost:8000/api/children/archived').subscribe({
      next: (response) => {
        if (response && response.success) {
          this.archivedChildren = response.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching archived records:', err);
      }
    });
  }

  // 1. CONFIRMATION ALERT Bago mag-restore (Inayos ang return type na Promise<void>)
  async confirmRestore(child: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Restore',
      message: `Are you sure you want to restore ${child.name} back to the active directory?`, // <--- Tinanggal ang <strong> tags
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Yes, Restore',
          handler: () => {
            this.executeRestore(child.id);
          }
        }
      ]
    });

    await alert.present();
  }


  // 2. TOTOONG EXECUTION NG RESTORE + TOAST NOTIFICATION + REMOVE SA LIST
  executeRestore(id: number): void {
    this.http.put<any>(`http://localhost:8000/api/children/restore/${id}`, {}).subscribe({
      next: async (response) => {
        if (response && response.success) {
          // 1. I-filter agad sa frontend para mawala sa view
          this.archivedChildren = this.archivedChildren.filter(item => item.id !== id);
          this.cdr.detectChanges();

          // 2. I-load ulit ang archived children para siguruhing naka-sync sa database
          this.loadArchivedChildren();

          // 3. Magpakita ng Toast na may "View" button papuntang child-dict
          const toast = await this.toastController.create({
            message: 'Successfully restored.',
            duration: 4000,
            position: 'bottom',
            color: 'success',
            mode: 'ios',
            buttons: [
              {
                text: 'View',
                role: 'info',
                handler: () => {
                  this.router.navigate(['/child-dict']);
                }
              }
            ]
          });
          await toast.present();
        }
      },
      error: (err) => {
        console.error('Error restoring child:', err);
      }
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

  viewChildDetails(child: any): void {
    this.router.navigate(['/add-child'], {
      queryParams: { id: child.id, viewMode: true }
    });
  }

  goBack(): void {
    this.router.navigate(['/archive']);
  }
}