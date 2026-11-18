import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonButton, IonIcon, IonItem, IonSelect, IonSelectOption, 
  IonInput, IonBackButton, ToastController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-add-child',
  templateUrl: './add-child.page.html',
  styleUrls: ['./add-child.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonInput,
    IonBackButton
  ]
})
export class AddChildPage implements OnInit {
  child: any = {
    name: '',
    dob: '',
    gender: '',
    age: null,
    guardian: '',
    contact: '',
    purok: '',
    weight: null,
    height: null,
    nutritionalStatus: ''
  };

  isEditMode: boolean = false;
  childId: number | null = null;
  isViewMode: boolean = false;
  pageTitle: string = 'Add new child record';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {
    addIcons({
      'save-outline': saveOutline
    });
  }

 ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // Para sa View Mode galing sa Archive
      if (params['viewMode']) {
        this.isViewMode = true;
        this.pageTitle = 'All child Record';
        
        const childId = params['id'];
        if (childId) {
          this.loadChildFromServer(+childId);
        }
      } 
      // Para sa Edit Mode galing sa Child Directory
      else if (params['editMode'] && params['id']) {
        this.isEditMode = true;
        this.childId = +params['id'];
        this.pageTitle = 'Edit Child Record';
        this.loadChildFromServer(this.childId);
      }
    });
  }

  loadChildFromServer(id: number): void {
    this.http.get<any>(`http://localhost:8000/api/children/${id}`).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const data = res.data;

          let rawDob = data.dob || data.date_of_birth || data.dateOfBirth || '';
          let formattedDob = '';
          if (rawDob) {
            formattedDob = rawDob.split('T')[0];
          }

          this.child = {
            name: data.name || data.fullName || data.child_name || '',
            dob: formattedDob,
            gender: data.gender || '',
            age: data.age !== undefined ? data.age : (data.ageMonths || data.age_months || 0),
            guardian: data.guardian || data.parent || data.guardian_name || '',
            contact: data.contact || data.contact_number || data.contactNumber || '',
            purok: data.purok || data.assigned_purok || '',
            weight: data.weight !== undefined ? data.weight : (data.weightKg || data.weight_kg || 0),
            height: data.height !== undefined ? data.height : (data.heightCm || data.height_cm || 0),
            nutritionalStatus: data.nutritionalStatus || data.nutritional_status || data.status || ''
          };
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading child details:', err);
      }
    });
  }

 async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color,
      mode: 'ios',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  saveChild(form: any): void {
    if (form.invalid) {
      this.presentToast('Please fill out all required fields.', 'danger');
      return;
    }

    if (this.isEditMode && this.childId) {
      this.http.put(`http://localhost:8000/api/children/${this.childId}`, this.child).subscribe({
        next: async (res: any) => {
          if (res && res.success) {
            await this.presentToast('Child record successfully updated!');
            this.router.navigate(['/child-dict']);
          }
        },
        error: (err) => {
          console.error('Error updating child:', err);
          this.presentToast('Failed to update child record.', 'danger');
        }
      });
    } else {
      this.http.post('http://localhost:8000/api/children', this.child).subscribe({
        next: async (res: any) => {
          if (res && res.success) {
            await this.presentToast('Child record successfully added!');
            this.router.navigate(['/child-dict']);
          }
        },
        error: (err) => {
          console.error('Error adding child:', err);
          this.presentToast('Failed to add child record.', 'danger');
        }
      });
    }
  }
}