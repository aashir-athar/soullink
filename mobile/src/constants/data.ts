// src/constants/data.ts — Static data used across onboarding + profile editing.
// Keeping this centralised means the same lists are available everywhere.

import type { EducationLevel, MatchingMode, Religion } from '@/src/types';

export const INTERESTS: readonly string[] = [
  'Travel',
  'Fitness',
  'Reading',
  'Cooking',
  'Faith',
  'Family',
  'Art',
  'Music',
  'Movies',
  'Photography',
  'Writing',
  'Nature',
  'Hiking',
  'Yoga',
  'Meditation',
  'Coffee',
  'Tea',
  'Cafes',
  'Dancing',
  'Theatre',
  'Concerts',
  'Museums',
  'History',
  'Philosophy',
  'Science',
  'Technology',
  'Startups',
  'Investing',
  'Entrepreneurship',
  'Design',
  'Fashion',
  'Minimalism',
  'Running',
  'Cycling',
  'Swimming',
  'Football',
  'Cricket',
  'Tennis',
  'Basketball',
  'Volunteering',
  'Pets',
  'Dogs',
  'Cats',
  'Gardening',
  'Baking',
  'Board Games',
  'Video Games',
  'Podcasts',
  'Journaling',
  'Astronomy',
  'Languages',
  'Poetry',
  'Sustainability',
  'Cars',
  'Motorbikes',
  'Boating',
  'Adventure',
  'Road Trips',
  'Camping',
  'Beaches',
  'Mountains',
  'Deserts',
  'Architecture',
  'Interior Design',
] as const;

export const RELIGION_OPTIONS: { value: Religion; label: string }[] = [
  { value: 'islam', label: 'Islam' },
  { value: 'christianity', label: 'Christianity' },
  { value: 'hinduism', label: 'Hinduism' },
  { value: 'sikhism', label: 'Sikhism' },
  { value: 'buddhism', label: 'Buddhism' },
  { value: 'judaism', label: 'Judaism' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: 'high_school', label: 'High School' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

export const MODES: {
  value: MatchingMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'friendship',
    label: 'Friendship',
    description: 'Meet people who share your interests. Any gender.',
  },
  {
    value: 'relationship',
    label: 'Relationship',
    description: 'Dating with intention. Opposite gender only.',
  },
  {
    value: 'marriage',
    label: 'Marriage',
    description: 'Partners aligned in faith. Opposite gender, same religion.',
  },
];

/** Thoughtful opening lines — kept warm, specific, never thirsty. */
export const COMPLIMENT_SUGGESTIONS: readonly string[] = [
  'Your energy in these photos is so calm. What keeps you grounded?',
  'We share more interests than I expected. Which one means most to you?',
  'Your bio made me genuinely smile. Thank you for writing it with care.',
  'You seem like someone who listens well. That stood out to me.',
  'Your values sound clear. I respect that.',
  'If you had an unhurried Sunday, how would you spend it?',
];

/** Reasons shown in the report flow — curated, not overwhelming. */
export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'inappropriate_photos', label: 'Inappropriate photos' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'suspected_fake', label: 'Suspected fake profile' },
  { value: 'underage', label: 'Seems underage' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Other concern' },
];

/** Short, representative country + city list — seed only.
 *  In production this would be a large searchable list or external API. */
export const COUNTRIES: string[] = [
  'Pakistan',
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Turkey',
  'Malaysia',
  'Indonesia',
  'Qatar',
  'Bahrain',
  'Kuwait',
  'Oman',
  'Bangladesh',
  'Sri Lanka',
  'Other',
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Pakistan: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot'],
  India: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Leeds', 'Edinburgh'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Seattle', 'Boston', 'Austin'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  France: ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse'],
  Turkey: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya'],
  Malaysia: ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
  Indonesia: ['Jakarta', 'Surabaya', 'Bandung', 'Medan'],
  Qatar: ['Doha', 'Al Rayyan'],
  Bahrain: ['Manama', 'Muharraq'],
  Kuwait: ['Kuwait City', 'Hawalli'],
  Oman: ['Muscat', 'Salalah'],
  Bangladesh: ['Dhaka', 'Chittagong', 'Sylhet'],
  'Sri Lanka': ['Colombo', 'Kandy', 'Galle'],
  Other: ['Other'],
};
