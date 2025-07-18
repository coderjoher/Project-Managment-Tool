export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      Chat: {
        Row: {
          createdAt: string
          id: string
          offerId: string
          projectId: string
        }
        Insert: {
          createdAt?: string
          id: string
          offerId: string
          projectId: string
        }
        Update: {
          createdAt?: string
          id?: string
          offerId?: string
          projectId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Chat_offerId_fkey"
            columns: ["offerId"]
            isOneToOne: false
            referencedRelation: "Offer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Chat_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
        ]
      }
      ChatMessage: {
        Row: {
          chatId: string
          content: string
          createdAt: string
          id: string
          platform: Database["public"]["Enums"]["MessagePlatform"]
          senderId: string
        }
        Insert: {
          chatId: string
          content: string
          createdAt?: string
          id: string
          platform?: Database["public"]["Enums"]["MessagePlatform"]
          senderId: string
        }
        Update: {
          chatId?: string
          content?: string
          createdAt?: string
          id?: string
          platform?: Database["public"]["Enums"]["MessagePlatform"]
          senderId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ChatMessage_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ChatMessage_senderId_fkey"
            columns: ["senderId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Financial: {
        Row: {
          acceptedPrice: number
          amountPaid: number
          createdAt: string
          estimatedBudget: number | null
          id: string
          paymentStatus: Database["public"]["Enums"]["PaymentStatus"]
          projectId: string
          updatedAt: string
        }
        Insert: {
          acceptedPrice: number
          amountPaid?: number
          createdAt?: string
          estimatedBudget?: number | null
          id: string
          paymentStatus?: Database["public"]["Enums"]["PaymentStatus"]
          projectId: string
          updatedAt: string
        }
        Update: {
          acceptedPrice?: number
          amountPaid?: number
          createdAt?: string
          estimatedBudget?: number | null
          id?: string
          paymentStatus?: Database["public"]["Enums"]["PaymentStatus"]
          projectId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Financial_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
        ]
      }
      FinancialUpdate: {
        Row: {
          amount: number | null
          createdAt: string
          description: string
          financialId: string
          id: string
          updatedById: string
        }
        Insert: {
          amount?: number | null
          createdAt?: string
          description: string
          financialId: string
          id: string
          updatedById: string
        }
        Update: {
          amount?: number | null
          createdAt?: string
          description?: string
          financialId?: string
          id?: string
          updatedById?: string
        }
        Relationships: [
          {
            foreignKeyName: "FinancialUpdate_financialId_fkey"
            columns: ["financialId"]
            isOneToOne: false
            referencedRelation: "Financial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FinancialUpdate_updatedById_fkey"
            columns: ["updatedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Invoice: {
        Row: {
          fileName: string
          fileUrl: string
          financialId: string
          id: string
          uploadedAt: string
        }
        Insert: {
          fileName: string
          fileUrl: string
          financialId: string
          id: string
          uploadedAt?: string
        }
        Update: {
          fileName?: string
          fileUrl?: string
          financialId?: string
          id?: string
          uploadedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Invoice_financialId_fkey"
            columns: ["financialId"]
            isOneToOne: false
            referencedRelation: "Financial"
            referencedColumns: ["id"]
          },
        ]
      }
      Offer: {
        Row: {
          createdAt: string
          deliveryTime: number
          description: string | null
          freelancerId: string
          id: string
          price: number
          projectId: string
          status: Database["public"]["Enums"]["OfferStatus"]
        }
        Insert: {
          createdAt?: string
          deliveryTime: number
          description?: string | null
          freelancerId: string
          id: string
          price: number
          projectId: string
          status?: Database["public"]["Enums"]["OfferStatus"]
        }
        Update: {
          createdAt?: string
          deliveryTime?: number
          description?: string | null
          freelancerId?: string
          id?: string
          price?: number
          projectId?: string
          status?: Database["public"]["Enums"]["OfferStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "Offer_freelancerId_fkey"
            columns: ["freelancerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Offer_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
        ]
      }
      Project: {
        Row: {
          budget: number | null
          clickupTaskId: string | null
          createdAt: string
          deadline: string | null
          description: string
          driveLink: string | null
          id: string
          managerId: string
          status: Database["public"]["Enums"]["ProjectStatus"]
          title: string
          updatedAt: string
        }
        Insert: {
          budget?: number | null
          clickupTaskId?: string | null
          createdAt?: string
          deadline?: string | null
          description: string
          driveLink?: string | null
          id: string
          managerId: string
          status?: Database["public"]["Enums"]["ProjectStatus"]
          title: string
          updatedAt: string
        }
        Update: {
          budget?: number | null
          clickupTaskId?: string | null
          createdAt?: string
          deadline?: string | null
          description?: string
          driveLink?: string | null
          id?: string
          managerId?: string
          status?: Database["public"]["Enums"]["ProjectStatus"]
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Project_managerId_fkey"
            columns: ["managerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          avatar: string | null
          createdAt: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["UserRole"]
        }
        Insert: {
          avatar?: string | null
          createdAt?: string
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
        }
        Update: {
          avatar?: string | null
          createdAt?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      MessagePlatform: "IN_APP" | "WHATSAPP" | "TELEGRAM"
      OfferStatus: "PENDING" | "ACCEPTED" | "REJECTED"
      PaymentStatus: "PENDING" | "PARTIAL" | "PAID"
      ProjectStatus: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      UserRole: "MANAGER" | "FREELANCER"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      MessagePlatform: ["IN_APP", "WHATSAPP", "TELEGRAM"],
      OfferStatus: ["PENDING", "ACCEPTED", "REJECTED"],
      PaymentStatus: ["PENDING", "PARTIAL", "PAID"],
      ProjectStatus: ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      UserRole: ["MANAGER", "FREELANCER"],
    },
  },
} as const
