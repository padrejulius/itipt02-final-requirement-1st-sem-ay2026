import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonCard, IonBadge, ToastController,AlertController} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, archiveOutline, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'app-archive-records',
  templateUrl: './archive-records.page.html',
  styleUrls: ['./archive-records.page.scss'],
  standalone: true,
  imports: [ CommonModule, HttpClientModule,IonHeader,IonToolbar,IonTitle, IonContent,IonButtons, IonButton, IonIcon, IonCard, IonBadge ]})

  export class ArchiveRecordsPage implements OnInit {
  archivedChildren = signal<any[]>([]);

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
          this.archivedChildren.set(response.data || []);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching archived records:', err);
      }
    });
  }

  async confirmRestore(child: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Restore',
      message: `Are you sure you want to restore ${child.name} back to the active directory?`,
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

  executeRestore(id: number): void {
    this.http.put<any>(`http://localhost:8000/api/children/restore/${id}`, {}).subscribe({
      next: async (response) => {
        if (response && response.success) {
          this.archivedChildren.update(list => list.filter(item => item.id !== id));
          this.cdr.detectChanges();

          this.loadArchivedChildren();

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