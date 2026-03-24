import React from "react";
import type { PaymentMethod } from "@/lib/types";

interface PaymentMethodIconProps {
  method: PaymentMethod | string;
  className?: string;
}

export function PaymentMethodIcon({ method, className = "w-5 h-5" }: PaymentMethodIconProps) {
  switch (method) {
    case "Zelle":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.0003 2.19324L21.3665 7.50296V16.4947L12.0003 21.8044L2.63403 16.4947V7.50296L12.0003 2.19324Z" fill="#741BCC"/>
          <path d="M16.9744 8.78345H14.1623L11.5168 12.3338H16.299V14.5422H6.99268V13.0645L12.054 6.27319H6.99268V4.05371H16.9744V8.78345Z" fill="white"/>
          <path d="M16.4523 15.6885H7.54858V19.4639H16.4523V15.6885Z" fill="white"/>
        </svg>
      );
    case "Venmo":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12Z" fill="#008CFF"/>
          <path d="M16.0374 8.24354C16.0374 9.94054 15.201 12.0315 14.136 14.673L10.9854 22.3845H6.42539L10.0464 4.88554H14.7579C14.7579 4.88554 15.4854 4.79354 16.0374 5.25354C16.5894 5.71354 16.0374 8.24354 16.0374 8.24354ZM13.8404 8.52754C14.004 7.62554 13.906 6.84554 13.3644 6.55154C12.8229 6.25754 11.8394 6.64354 11.6759 7.54554C11.5124 8.44754 11.6104 9.22754 12.152 9.52154C12.6935 9.81554 13.6769 9.42954 13.8404 8.52754Z" fill="white"/>
        </svg>
      );
    case "PayPal":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.38002 0.0592041L21.6156 0.0592041C22.9332 0.0592041 24.0002 1.12621 24.0002 2.44383V21.6794C24.0002 22.997 22.9332 24.064 21.6156 24.064H2.38002C1.0624 24.064 -0.00460815 22.997 -0.00460815 21.6794V2.44383C-0.00460815 1.12621 1.0624 0.0592041 2.38002 0.0592041Z" fill="#003087"/>
          <path d="M12.915 7.689L13.518 7.377C14.043 7.106 14.739 6.945 15.545 6.945H17.433C18.618 6.945 19.467 7.222 19.957 7.733C20.448 8.242 20.612 8.956 20.528 9.771C20.354 11.458 19.539 12.721 18.272 13.435C17.464 13.882 16.485 14.12 15.311 14.12H13.816L12.915 7.689Z" fill="#0079C1"/>
          <path d="M14.444 6.832C13.815 7.158 13.351 7.424 13.045 7.618C12.673 7.854 12.399 8.136 12.227 8.441C12.046 8.761 11.921 9.176 11.833 9.696L10.741 16.536C10.709 16.738 10.669 16.914 10.618 17.067L9.349 16.791H6.049C5.978 16.791 5.918 16.76 5.867 16.696C5.816 16.634 5.792 16.565 5.797 16.488L6.812 10.323L7.491 6.014C7.502 5.922 7.531 5.842 7.575 5.77C7.621 5.698 7.679 5.632 7.747 5.568C7.818 5.503 7.896 5.443 7.986 5.385C8.077 5.326 8.169 5.275 8.258 5.228H15.693C15.222 5.688 14.819 6.22 14.444 6.832Z" fill="#00457C"/>
          <path d="M14.17 14.288C13.829 14.433 13.447 14.505 13.018 14.505H11.52L10.596 20.297C10.585 20.366 10.551 20.428 10.495 20.485C10.441 20.542 10.373 20.573 10.29 20.573H7.07299C6.98599 20.573 6.91199 20.536 6.85299 20.463C6.79299 20.388 6.77299 20.3 6.79099 20.198L7.75599 14.256L7.81599 13.882H11.503C12.352 13.882 13.12 13.784 13.816 13.6C13.987 13.553 14.162 13.5 14.341 13.442L14.363 13.435C14.305 13.754 14.24 14.038 14.17 14.288Z" fill="#0079C1"/>
        </svg>
      );
    case "Credit Card":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "Check":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "Cash":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}
