import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UserService, User, UpdateUserRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ConfirmDeleteComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit {
  userForm: FormGroup;
  user: User | null = null;
  userId: string | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  currentUser: any;
  isOwnProfile = false;
  
  // Confirm delete modal properties
  showConfirmDelete = false;
  deleting = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      avatarUrl: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      
      // Get current user ID from multiple possible fields
      let currentUserId = null;
      if (this.currentUser) {
        currentUserId = this.currentUser._id || this.currentUser.id;
      }
      
      // Check if this is the user's own profile
      this.isOwnProfile = this.currentUser && this.userId === currentUserId;
      
      this.loadUser();
    });
  }

  loadUser(): void {
    if (!this.userId) return;
    
    this.loading = true;
    this.errorMessage = '';

    // Use the most appropriate method based on whether it's own profile or not
    if (this.isOwnProfile) {
      // For own profile, try /me endpoint first, fallback to users list
      this.userService.getCurrentUser().subscribe({
        next: (user: User) => {
          if (user) {
            this.user = user;
            this.populateForm(user);
            this.loading = false;
          } else {
            this.loadUserFromList();
          }
        },
        error: (error: any) => {
          console.error('Error loading current user via /me endpoint:', error);
          // Fallback to loading from users list
          this.loadUserFromList();
        }
      });
    } else {
      this.loadUserFromList();
    }
  }

  private loadUserFromList(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        const user = users.find(u => (u.id || u._id) === this.userId);
        if (user) {
          this.user = user;
          this.populateForm(user);
          this.loading = false;
        } else {
          this.loading = false;
          this.errorMessage = 'User not found.';
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = 'Failed to load user details. Please try again.';
        console.error('Error loading user from list:', error);
      }
    });
  }

  populateForm(user: User): void {
    if (!user) {
      console.error('Cannot populate form: user is null or undefined');
      return;
    }
    
    // Ensure we have valid data before patching
    const formData = {
      name: user.name || '',
      email: user.email || '',
      avatarUrl: user.avatarUrl || ''
    };
    
    // Reset form first to ensure clean state
    this.userForm.reset();
    
    // Patch the form with user data
    this.userForm.patchValue(formData);
    
    // Mark form as not touched to avoid validation errors initially
    this.userForm.markAsUntouched();
    
    // Disable email field as it's typically not editable
    this.userForm.get('email')?.disable();
  }

  onSubmit(): void {
    if (this.userForm.valid && this.userId) {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const updateData: UpdateUserRequest = {
        name: this.userForm.value.name,
        avatarUrl: this.userForm.value.avatarUrl || undefined
      };

      // Use appropriate update method based on profile type
      const updateObservable = this.isOwnProfile 
        ? this.userService.updateCurrentUser(updateData)
        : this.userService.updateUserById(this.userId, updateData);

      updateObservable.subscribe({
        next: (updatedUser: User) => {
          this.user = updatedUser;
          this.saving = false;
          this.successMessage = 'User updated successfully!';
          
          // Update session storage if it's the current user
          if (this.isOwnProfile) {
            const currentUserData = this.authService.getCurrentUser();
            const updatedUserData = { ...currentUserData, ...updatedUser };
            sessionStorage.setItem('auth_user', JSON.stringify(updatedUserData));
          }
        },
        error: (error: any) => {
          this.saving = false;
          this.errorMessage = error.error?.message || 'Failed to update user. Please try again.';
          console.error('Error updating user:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onDeleteUser(): void {
    if (!this.userId || !this.user) return;
    
    // Prevent self-deletion
    if (this.isOwnProfile) {
      this.errorMessage = 'You cannot delete your own account.';
      return;
    }

    // Show confirm delete modal
    this.showConfirmDelete = true;
  }

  confirmDeleteUser(): void {
    if (!this.userId || !this.user) return;
    
    this.deleting = true;
    this.errorMessage = '';
    
    this.userService.deleteUserById(this.userId).subscribe({
      next: () => {
        this.deleting = false;
        this.showConfirmDelete = false;
        this.successMessage = 'User deleted successfully!';
        // Navigate back to users list after a delay
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 1500);
      },
      error: (error: any) => {
        this.deleting = false;
        this.showConfirmDelete = false;
        this.errorMessage = error.error?.message || 'Failed to delete user. Please try again.';
        console.error('Error deleting user:', error);
      }
    });
  }

  cancelDeleteUser(): void {
    this.showConfirmDelete = false;
    this.deleting = false;
  }

  getPreviewAvatarUrl(): string | null {
    // Get the current avatar URL from the form (live preview) or fallback to user data
    const formAvatarUrl = this.userForm.get('avatarUrl')?.value;
    const userAvatarUrl = this.user?.avatarUrl;
    
    const result = (formAvatarUrl && formAvatarUrl.trim() !== '') ? formAvatarUrl : userAvatarUrl || null;
    
    // Return form value if it exists and is not empty, otherwise return user's avatar URL
    return result;
  }

  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // Check if it's a direct image URL (not a Google search redirect)
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
    const directImageHosts = ['picsum.photos', 'via.placeholder.com', 'avatars.githubusercontent.com', 'i.imgur.com'];
    
    // Check for common direct image patterns
    return imageExtensions.test(url) || 
           directImageHosts.some(host => url.includes(host)) ||
           url.includes('data:image/');
  }

  onAvatarError(event: any): void {
    // Hide the broken image and show the default avatar
    console.log('Avatar Error - Image failed to load:', event.target.src);
    event.target.style.display = 'none';
    // The template will automatically show the default avatar due to *ngIf condition
  }

  onAvatarLoad(event: any): void {
    console.log('Avatar Success - Image loaded:', event.target.src);
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }
}
