import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonButton, IonIcon, IonItem, IonCard, IonBadge, IonBackButton, ToastController, AlertController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { refreshOutline, trashOutline, archiveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-archive-schedule',
  templateUrl: './archive-schedule.page.html',
  styleUrls: ['./archive-schedule.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonCard,
    IonBadge,
    IonBackButton
  ]
})
export class ArchiveSchedulePage implements OnInit {
  archivedSchedules: any[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      'refresh-outline': refreshOutline,
      'trash-outline': trashOutline,
      'archive-outline': archiveOutline
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadArchivedSchedules();
  }

  loadArchivedSchedules(): void {
    this.http.get<any>('http://localhost:8000/api/schedules/archived').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.archivedSchedules = res.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading archived schedules:', err);
      }
    });
  }

  openArchivedScheduleDetails(schedule: any): void {
    if (!schedule || !schedule.id) return;
    this.router.navigate(['/vaccine-sched'], {
      state: { 
        scheduleData: schedule, 
        scheduleId: schedule.id,
        isViewOnly: true 
      }
    });
  }

async restoreSchedule(scheduleOrEvent: any, maybeSchedule?: any) {

    const schedule = maybeSchedule ? maybeSchedule : scheduleOrEvent;
    if (scheduleOrEvent && typeof scheduleOrEvent.stopPropagation === 'function') {
      scheduleOrEvent.stopPropagation();
    }

    const alertPopup = await this.alertController.create({
      header: 'Confirm Restore',
      message: `Are you sure you want to restore ${schedule.childName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes, Restore',
          handler: () => {
            this.http.put<any>(`http://localhost:8000/api/schedules/restore/${schedule.id}`, {}).subscribe({
              next: async (res) => {
                if (res && res.success) {
                  this.archivedSchedules = this.archivedSchedules.filter(s => s.id !== schedule.id);
                  this.cdr.detectChanges();
                  
                  const toast = await this.toastController.create({
                    message: 'Schedule successfully restored to active list.',
                    duration: 3000,
                    position: 'bottom',
                    color: 'success',
                    mode: 'ios'
                  });
                  await toast.present();
                }
              },
              error: (err) => {
                console.error('Error restoring schedule:', err);
              }
            });
          }
        }
      ]
    });

    await alertPopup.present();
  }
}