import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonItem, IonSelect, IonSelectOption, IonInput, IonBackButton, ToastController} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-add-child',
  templateUrl: './add-child.page.html',
  styleUrls: ['./add-child.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, HttpClientModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonItem, IonSelect, IonSelectOption, IonInput,IonBackButton ]})

export class AddChildPage implements OnInit {
  child = signal<any>({
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
  });

  isEditMode = signal<boolean>(false);
  childId = signal<number | null>(null);
  isViewMode = signal<boolean>(false);
  pageTitle = signal<string>('Add new child record');

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
        this.isViewMode.set(true);
        this.pageTitle.set('All child Record');

        const idParam = params['id'];
        if (idParam) {
          this.loadChildFromServer(+idParam);
        }
      }
      // Para sa Edit Mode galing sa Child Directory
      else if (params['editMode'] && params['id']) {
        this.isEditMode.set(true);
        this.childId.set(+params['id']);
        this.pageTitle.set('Edit Child Record');
        this.loadChildFromServer(this.childId()!);
      }
    });
  }

  private computeNutritionalStatus(ageYearsVal: any, weightVal: any): string {
    const ageYears = Number(ageYearsVal);
    const weight = Number(weightVal);

    if (!ageYears || ageYears <= 0 || !weight || weight <= 0) {
      return '';
    }

    const clampedYears = Math.min(Math.max(ageYears, 1), 12);
    const ageMonths = clampedYears * 12;

    const expectedWeight =
      ageMonths <= 12
        ? 3.3 + ageMonths * 0.55
        : ageMonths <= 60
          ? 9.6 + (ageMonths - 12) * 0.18
          : 18.24 + (ageMonths - 60) * 0.25;

    const ratio = weight / expectedWeight;

    if (ratio < 0.7) {
      return 'Severely Underweight';
    }
    if (ratio < 0.85) {
      return 'Underweight';
    }
    if (ratio > 1.2) {
      return 'Overweight';
    }
    return 'Normal';
  }

  updateChildField(field: string, value: any): void {
    this.child.update(current => {
      const updated = {
        ...current,
        [field]: value
      };

      if (field === 'age' || field === 'weight') {
        updated.nutritionalStatus = this.computeNutritionalStatus(updated.age, updated.weight);
      }

      return updated;
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

          this.child.set({
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
          });

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

    const payload = this.child();
    const currentId = this.childId();

    if (this.isEditMode() && currentId) {
      this.http.put(`http://localhost:8000/api/children/${currentId}`, payload).subscribe({
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
      this.http.post('http://localhost:8000/api/children', payload).subscribe({
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