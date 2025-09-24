// src/components/add-transaction-form.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { fetchBuildings } from "@/lib/supabase-data";

interface AddTransactionFormProps {
  user: User | null;
  onTransactionAdded: () => void;
}

interface Building {
  building_id: string; // Updated to match your query
  name: string;
}

// Helper function to check for valid UUIDs
function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid || uuid === "null" || uuid === "" || uuid === "undefined") {
    return false
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function AddTransactionForm({ user, onTransactionAdded }: AddTransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);

  const expenseCategories = ["Rent", "Utilities", "Maintenance", "Supplies", "Marketing", "Other"];
  const incomeCategories = ["Rent Payment", "Deposit", "Other"];

  useEffect(() => {
    async function loadInitialData() {
      if (!user?.id) {
        return;
      }
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("company_account_id")
          .eq("id", user.id)
          .single();
        
        if (userError || !isValidUUID(userData?.company_account_id)) {
            throw new Error("Failed to retrieve company ID or company not associated with user.");
        }
        
        setCompanyId(userData.company_account_id);

        // Here we fetch the buildings and set the state
        const buildingsData = await fetchBuildings();
        const typedBuildings = Array.isArray(buildingsData) ? buildingsData.map(b => ({
          building_id: b.building_id,
          name: b.name
        })) : [];

        setBuildings(typedBuildings);
        if (typedBuildings.length > 0) {
          setSelectedBuildingId(typedBuildings[0].building_id);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    }
    loadInitialData();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!user) {
      setError("User not authenticated.");
      setIsLoading(false);
      return;
    }

    if (!companyId) {
        setError("Company information not found. Cannot add transaction.");
        setIsLoading(false);
        return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      setIsLoading(false);
      return;
    }

    if (transactionType === "expense" && !selectedBuildingId) {
      setError("Please select a building for the expense.");
      setIsLoading(false);
      return;
    }

    try {
      const commonData = {
        amount: parsedAmount,
        description,
        created_at: date,
        user_id: user.id,
        company_account_id: companyId,
        status: "completed",
      };

      if (transactionType === "income") {
        const { error: insertError } = await supabase
          .from("payments")
          .insert({
            ...commonData,
          });
        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase
          .from("expenses")
          .insert({
            ...commonData,
            category: category,
            building_id: selectedBuildingId,
          });
        if (insertError) throw insertError;
      }

      setSuccess("Transaction added successfully!");
      setAmount("");
      setDescription("");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);
      onTransactionAdded();
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      setError(err.message || "Failed to add transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="bg-green-50">
          <AlertTitle className="text-green-700">{success}</AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={transactionType} onValueChange={(value: "income" | "expense") => setTransactionType(value)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="e.g., 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {(transactionType === "income" ? incomeCategories : expenseCategories).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {transactionType === "expense" && (
        <div className="space-y-2">
          <Label htmlFor="building">Building</Label>
          <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
            <SelectTrigger id="building">
              <SelectValue placeholder="Select a building" />
            </SelectTrigger>
            <SelectContent>
              {buildings.length > 0 ? (
                buildings.map((building) => (
                  <SelectItem key={building.building_id} value={building.building_id}>
                    {building.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-buildings" disabled>
                  No buildings found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="e.g., Monthly rent from John Doe"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Transaction"
        )}
      </Button>
    </form>
  );
}