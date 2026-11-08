export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          admin_note: string | null
          id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      account_verifications: {
        Row: {
          address: string
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          id_document_type: string
          phone: string
          reviewer_note: string | null
          ssn_last4: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          country: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          id_document_type: string
          phone: string
          reviewer_note?: string | null
          ssn_last4?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          id_document_type?: string
          phone?: string
          reviewer_note?: string | null
          ssn_last4?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_asset_config_audit: {
        Row: {
          admin_id: string | null
          asset: string
          created_at: string
          id: string
          network: string
          next_enabled: boolean
          next_minimum_deposit: number
          next_required_confirmations: number
          note: string
          previous_enabled: boolean | null
          previous_minimum_deposit: number | null
          previous_required_confirmations: number | null
        }
        Insert: {
          admin_id?: string | null
          asset: string
          created_at?: string
          id?: string
          network: string
          next_enabled: boolean
          next_minimum_deposit: number
          next_required_confirmations: number
          note: string
          previous_enabled?: boolean | null
          previous_minimum_deposit?: number | null
          previous_required_confirmations?: number | null
        }
        Update: {
          admin_id?: string | null
          asset?: string
          created_at?: string
          id?: string
          network?: string
          next_enabled?: boolean
          next_minimum_deposit?: number
          next_required_confirmations?: number
          note?: string
          previous_enabled?: boolean | null
          previous_minimum_deposit?: number | null
          previous_required_confirmations?: number | null
        }
        Relationships: []
      }
      admin_email_notification_deliveries: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id: string
          sent_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_email_notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_email_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_email_notification_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_email_notifications: {
        Row: {
          audience: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          message: string
          recipient_count: number
          sent_count: number
          status: string
          subject: string
        }
        Insert: {
          audience?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          message: string
          recipient_count?: number
          sent_count?: number
          status?: string
          subject: string
        }
        Update: {
          audience?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          message?: string
          recipient_count?: number
          sent_count?: number
          status?: string
          subject?: string
        }
        Relationships: []
      }
      admin_balance_adjustments: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string
          direction: string
          id: string
          note: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string
          direction: string
          id?: string
          note: string
          transaction_id: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string
          direction?: string
          id?: string
          note?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_balance_adjustments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_balance_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_referrals: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reward_usd: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_usd?: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_usd?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings_audit: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          next_value: Json
          note: string | null
          previous_value: Json | null
          section: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          next_value: Json
          note?: string | null
          previous_value?: Json | null
          section: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          next_value?: Json
          note?: string | null
          previous_value?: Json | null
          section?: string
        }
        Relationships: []
      }
      admin_trade_settings_audit: {
        Row: {
          admin_id: string | null
          coin: string
          created_at: string
          id: string
          network: string
          next_buy_enabled: boolean
          next_buy_price_usd: number
          next_maximum_crypto_amount: number
          next_minimum_crypto_amount: number
          next_sell_enabled: boolean
          next_sell_price_usd: number
          note: string
          previous_buy_enabled: boolean
          previous_buy_price_usd: number
          previous_maximum_crypto_amount: number
          previous_minimum_crypto_amount: number
          previous_sell_enabled: boolean
          previous_sell_price_usd: number
        }
        Insert: {
          admin_id?: string | null
          coin: string
          created_at?: string
          id?: string
          network: string
          next_buy_enabled: boolean
          next_buy_price_usd: number
          next_maximum_crypto_amount: number
          next_minimum_crypto_amount: number
          next_sell_enabled: boolean
          next_sell_price_usd: number
          note: string
          previous_buy_enabled: boolean
          previous_buy_price_usd: number
          previous_maximum_crypto_amount: number
          previous_minimum_crypto_amount: number
          previous_sell_enabled: boolean
          previous_sell_price_usd: number
        }
        Update: {
          admin_id?: string | null
          coin?: string
          created_at?: string
          id?: string
          network?: string
          next_buy_enabled?: boolean
          next_buy_price_usd?: number
          next_maximum_crypto_amount?: number
          next_minimum_crypto_amount?: number
          next_sell_enabled?: boolean
          next_sell_price_usd?: number
          note?: string
          previous_buy_enabled?: boolean
          previous_buy_price_usd?: number
          previous_maximum_crypto_amount?: number
          previous_minimum_crypto_amount?: number
          previous_sell_enabled?: boolean
          previous_sell_price_usd?: number
        }
        Relationships: []
      }
      admin_user_management: {
        Row: {
          account_status: string
          admin_note: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          account_status?: string
          admin_note?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          account_status?: string
          admin_note?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_management_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_verification_reviews: {
        Row: {
          created_at: string
          decision: string
          email_status: string
          id: string
          note: string | null
          reviewer_id: string
          user_id: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          email_status?: string
          id?: string
          note?: string | null
          reviewer_id: string
          user_id: string
          verification_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          email_status?: string
          id?: string
          note?: string | null
          reviewer_id?: string
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_verification_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_verification_reviews_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "account_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_buys: {
        Row: {
          coin: string
          created_at: string
          crypto_amount: number
          fee_usd: number
          id: string
          network: string
          price_usd: number
          status: string
          total_usd: number
          tx_hash: string | null
          updated_at: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          coin: string
          created_at?: string
          crypto_amount: number
          fee_usd?: number
          id?: string
          network: string
          price_usd?: number
          status?: string
          total_usd?: number
          tx_hash?: string | null
          updated_at?: string
          usd_amount: number
          user_id: string
        }
        Update: {
          coin?: string
          created_at?: string
          crypto_amount?: number
          fee_usd?: number
          id?: string
          network?: string
          price_usd?: number
          status?: string
          total_usd?: number
          tx_hash?: string | null
          updated_at?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_buys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_receives: {
        Row: {
          amount: number | null
          coin: string
          created_at: string
          from_address: string | null
          id: string
          network: string
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount?: number | null
          coin: string
          created_at?: string
          from_address?: string | null
          id?: string
          network: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number | null
          coin?: string
          created_at?: string
          from_address?: string | null
          id?: string
          network?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_receives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_sells: {
        Row: {
          coin: string
          created_at: string
          crypto_amount: number
          fee_usd: number
          id: string
          network: string
          payout_usd: number
          price_usd: number
          status: string
          tx_hash: string | null
          updated_at: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          coin: string
          created_at?: string
          crypto_amount: number
          fee_usd?: number
          id?: string
          network: string
          payout_usd?: number
          price_usd?: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
          usd_amount: number
          user_id: string
        }
        Update: {
          coin?: string
          created_at?: string
          crypto_amount?: number
          fee_usd?: number
          id?: string
          network?: string
          payout_usd?: number
          price_usd?: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_sells_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_sends: {
        Row: {
          amount: number
          coin: string
          created_at: string
          fee: number
          id: string
          network: string
          note: string | null
          status: string
          to_address: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          coin: string
          created_at?: string
          fee?: number
          id?: string
          network: string
          note?: string | null
          status?: string
          to_address: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          coin?: string
          created_at?: string
          fee?: number
          id?: string
          network?: string
          note?: string | null
          status?: string
          to_address?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_sends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custody_provisioning_jobs: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          id: string
          last_error_code: string | null
          locked_until: string | null
          network: string
          provisioning_version: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          id?: string
          last_error_code?: string | null
          locked_until?: string | null
          network: string
          provisioning_version?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          id?: string
          last_error_code?: string | null
          locked_until?: string | null
          network?: string
          provisioning_version?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custody_provisioning_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_observations: {
        Row: {
          amount_usd: number | null
          asset: string
          below_minimum: boolean
          block_hash: string | null
          block_number: number | null
          confirmations: number
          confirmed_at: string | null
          created_at: string
          crypto_amount: number
          deposit_address: string
          destination_tag: number | null
          event_index: number
          failure_reason: string | null
          id: string
          network: string
          observed_at: string
          required_confirmations: number
          status: string
          tx_hash: string
          updated_at: string
          user_id: string | null
          wallet_account_id: string | null
        }
        Insert: {
          amount_usd?: number | null
          asset: string
          below_minimum?: boolean
          block_hash?: string | null
          block_number?: number | null
          confirmations?: number
          confirmed_at?: string | null
          created_at?: string
          crypto_amount: number
          deposit_address: string
          destination_tag?: number | null
          event_index?: number
          failure_reason?: string | null
          id?: string
          network: string
          observed_at?: string
          required_confirmations?: number
          status?: string
          tx_hash: string
          updated_at?: string
          user_id?: string | null
          wallet_account_id?: string | null
        }
        Update: {
          amount_usd?: number | null
          asset?: string
          below_minimum?: boolean
          block_hash?: string | null
          block_number?: number | null
          confirmations?: number
          confirmed_at?: string | null
          created_at?: string
          crypto_amount?: number
          deposit_address?: string
          destination_tag?: number | null
          event_index?: number
          failure_reason?: string | null
          id?: string
          network?: string
          observed_at?: string
          required_confirmations?: number
          status?: string
          tx_hash?: string
          updated_at?: string
          user_id?: string | null
          wallet_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_observations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_observations_wallet_account_id_fkey"
            columns: ["wallet_account_id"]
            isOneToOne: false
            referencedRelation: "wallet_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_asset_networks: {
        Row: {
          asset: string
          created_at: string
          display_name: string
          enabled: boolean
          minimum_deposit: number
          network: string
          required_confirmations: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          asset: string
          created_at?: string
          display_name: string
          enabled?: boolean
          minimum_deposit?: number
          network: string
          required_confirmations?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          asset?: string
          created_at?: string
          display_name?: string
          enabled?: boolean
          minimum_deposit?: number
          network?: string
          required_confirmations?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          branding: Json
          created_at: string
          features: Json
          general: Json
          id: number
          policies: Json
          support: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branding?: Json
          created_at?: string
          features?: Json
          general?: Json
          id?: number
          policies?: Json
          support?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branding?: Json
          created_at?: string
          features?: Json
          general?: Json
          id?: number
          policies?: Json
          support?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          my_referral_code: string | null
          phone: string | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          my_referral_code?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          my_referral_code?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trade_asset_settings: {
        Row: {
          buy_enabled: boolean
          buy_price_usd: number
          coin: string
          created_at: string
          maximum_crypto_amount: number
          minimum_crypto_amount: number
          network: string
          sell_enabled: boolean
          sell_price_usd: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          buy_enabled?: boolean
          buy_price_usd: number
          coin: string
          created_at?: string
          maximum_crypto_amount: number
          minimum_crypto_amount: number
          network: string
          sell_enabled?: boolean
          sell_price_usd: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          buy_enabled?: boolean
          buy_price_usd?: number
          coin?: string
          created_at?: string
          maximum_crypto_amount?: number
          minimum_crypto_amount?: number
          network?: string
          sell_enabled?: boolean
          sell_price_usd?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          coin: string | null
          counterparty: string | null
          created_at: string
          crypto_amount: number | null
          direction: string
          fee_usd: number
          id: string
          kind: string
          network: string | null
          note: string | null
          price_usd: number
          reference: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          coin?: string | null
          counterparty?: string | null
          created_at?: string
          crypto_amount?: number | null
          direction?: string
          fee_usd?: number
          id?: string
          kind: string
          network?: string | null
          note?: string | null
          price_usd?: number
          reference?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          usd_amount?: number
          user_id: string
        }
        Update: {
          coin?: string | null
          counterparty?: string | null
          created_at?: string
          crypto_amount?: number | null
          direction?: string
          fee_usd?: number
          id?: string
          kind?: string
          network?: string | null
          note?: string | null
          price_usd?: number
          reference?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_balance_observations: {
        Row: {
          amount_usd: number | null
          asset: string
          balance: number
          block_hash: string | null
          block_number: number | null
          created_at: string
          id: string
          observation_ref: string
          observed_at: string
          wallet_account_id: string
        }
        Insert: {
          amount_usd?: number | null
          asset: string
          balance: number
          block_hash?: string | null
          block_number?: number | null
          created_at?: string
          id?: string
          observation_ref: string
          observed_at: string
          wallet_account_id: string
        }
        Update: {
          amount_usd?: number | null
          asset?: string
          balance?: number
          block_hash?: string | null
          block_number?: number | null
          created_at?: string
          id?: string
          observation_ref?: string
          observed_at?: string
          wallet_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treasury_balance_observations_wallet_account_id_fkey"
            columns: ["wallet_account_id"]
            isOneToOne: false
            referencedRelation: "treasury_wallet_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_operation_requests: {
        Row: {
          amount: number
          asset: string
          cancelled_at: string | null
          cancelled_by: string | null
          destination_address: string | null
          from_location: string
          id: string
          network: string
          operation_type: string
          reason: string
          requested_at: string
          requested_by: string | null
          status: string
          to_location: string
        }
        Insert: {
          amount: number
          asset: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          destination_address?: string | null
          from_location: string
          id?: string
          network: string
          operation_type: string
          reason: string
          requested_at?: string
          requested_by?: string | null
          status?: string
          to_location: string
        }
        Update: {
          amount?: number
          asset?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          destination_address?: string | null
          from_location?: string
          id?: string
          network?: string
          operation_type?: string
          reason?: string
          requested_at?: string
          requested_by?: string | null
          status?: string
          to_location?: string
        }
        Relationships: []
      }
      treasury_wallet_accounts: {
        Row: {
          address: string
          created_at: string
          id: string
          label: string
          network: string
          status: string
          turnkey_created_at: string | null
          turnkey_wallet_id: string | null
          updated_at: string
          wallet_type: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          label: string
          network: string
          status?: string
          turnkey_created_at?: string | null
          turnkey_wallet_id?: string | null
          updated_at?: string
          wallet_type: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          label?: string
          network?: string
          status?: string
          turnkey_created_at?: string | null
          turnkey_wallet_id?: string | null
          updated_at?: string
          wallet_type?: string
        }
        Relationships: []
      }
      user_pins: {
        Row: {
          created_at: string
          failed_attempts: number
          locked_until: string | null
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_accounts: {
        Row: {
          address: string | null
          created_at: string
          custody_reference: string | null
          destination_tag: number | null
          id: string
          network: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          custody_reference?: string | null
          destination_tag?: number | null
          id?: string
          network: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          custody_reference?: string | null
          destination_tag?: number | null
          id?: string
          network?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_fundings: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_method: string
          reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          payment_method: string
          reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_fundings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      treasury_latest_balance_observations: {
        Row: {
          amount_usd: number | null
          asset: string | null
          balance: number | null
          block_hash: string | null
          block_number: number | null
          id: string | null
          observation_ref: string | null
          observed_at: string | null
          wallet_account_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treasury_balance_observations_wallet_account_id_fkey"
            columns: ["wallet_account_id"]
            isOneToOne: false
            referencedRelation: "treasury_wallet_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_platform_revenue_summary: {
        Args: { _period_end: string; _period_start: string }
        Returns: {
          lifetime_revenue: number
          period_revenue: number
          transaction_kind: string
        }[]
      }
      admin_adjust_user_balance: {
        Args: {
          _admin_id: string
          _amount: number
          _direction: string
          _note: string
          _target_user_id: string
        }
        Returns: Json
      }
      admin_get_user_balance: {
        Args: { _admin_id: string; _target_user_id: string }
        Returns: number
      }
      admin_update_asset_network: {
        Args: {
          _admin_id: string
          _asset: string
          _enabled: boolean
          _minimum_deposit: number
          _network: string
          _note: string
          _required_confirmations: number
        }
        Returns: Json
      }
      admin_update_platform_settings: {
        Args: {
          _admin_id: string
          _note: string
          _section: string
          _value: Json
        }
        Returns: Json
      }
      admin_update_trade_asset_settings: {
        Args: {
          _admin_id: string
          _buy_enabled: boolean
          _buy_price_usd: number
          _coin: string
          _maximum_crypto_amount: number
          _minimum_crypto_amount: number
          _network: string
          _note: string
          _sell_enabled: boolean
          _sell_price_usd: number
        }
        Returns: Json
      }
      buy_crypto_with_balance: {
        Args: {
          _coin: string
          _network: string
          _price_usd: number
          _usd_amount: number
        }
        Returns: Json
      }
      change_login_pin: {
        Args: { _current_pin: string; _new_pin: string }
        Returns: undefined
      }
      check_signup_available: {
        Args: { _email: string; _phone: string }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      get_platform_flags: { Args: never; Returns: Json }
      has_login_pin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_phone: { Args: { _phone: string }; Returns: string }
      record_chain_deposit: {
        Args: {
          _amount_usd: number
          _asset: string
          _block_hash: string
          _block_number: number
          _confirmations: number
          _crypto_amount: number
          _deposit_address: string
          _destination_tag: number
          _event_index: number
          _failure_reason?: string
          _is_failed?: boolean
          _network: string
          _observed_at?: string
          _required_confirmations: number
          _tx_hash: string
        }
        Returns: string
      }
      record_treasury_balance_observation: {
        Args: {
          _address: string
          _amount_usd: number
          _asset: string
          _balance: number
          _block_hash: string
          _block_number: number
          _network: string
          _observation_ref: string
          _observed_at: string
        }
        Returns: string
      }
      sell_crypto_to_balance: {
        Args: {
          _coin: string
          _crypto_amount: number
          _network: string
          _price_usd: number
        }
        Returns: Json
      }
      set_login_pin: { Args: { _pin: string }; Returns: undefined }
      sync_company_treasury_wallets: {
        Args: { _wallets: Json }
        Returns: number
      }
      verify_login_pin: { Args: { _pin: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
