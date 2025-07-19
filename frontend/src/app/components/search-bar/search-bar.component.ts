import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface TagSelectionEvent {
  tag: string;
  source: 'autocomplete' | 'manual';
}

export interface SearchChangeEvent {
  searchTerm: string;
  hasTagPrefix: boolean;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatChipsModule
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
  @Input() searchTerm: string = '';
  @Input() label: string = 'Search';
  @Input() placeholder: string = 'Type to search...';
  @Input() availableTags: readonly string[] = [];
  @Output() searchChange = new EventEmitter<string>();
  @Output() tagSelected = new EventEmitter<string>();

  readonly searchControl = new FormControl<string>('');
  filteredTags: Observable<readonly string[]> = new Observable();

  ngOnInit(): void {
    this.searchControl.setValue(this.searchTerm);
    
    this.filteredTags = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );
  }

  ngOnChanges(): void {
    if (this.searchControl.value !== this.searchTerm) {
      this.searchControl.setValue(this.searchTerm, { emitEvent: false });
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  onTagSelected(tag: string): void {
    this.tagSelected.emit(tag);
    this.searchControl.setValue(`tag:${tag}`);
  }

  private _filterTags(value: string): string[] {
    if (!value || !value.startsWith('tag:')) {
      return this.availableTags.slice(0, 5); // Show first 5 tags as suggestions
    }
    
    const filterValue = value.replace('tag:', '').toLowerCase();
    return this.availableTags
      .filter(tag => tag.toLowerCase().includes(filterValue))
      .slice(0, 5);
  }
}
