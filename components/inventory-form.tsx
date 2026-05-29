"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  inventoryFormSchema,
  typeOptions,
  areaPlantedOptions,
  seasonOptions,
  InventoryFormValues,
} from "@/lib/schemas/inventory";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUser } from "@/context/UserContext";

export function InventoryForm({ onAdd }: { onAdd?: (item: any) => void } = {}) {
  const { user } = useUser();
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      type: "white",
      area_planted: "",
      year: "",
      season: "wet",
      location: "LBTR",
      shelf_code: "",
      description: "",
      pedigree: "",
      remarks: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: InventoryFormValues) {
    setIsSubmitting(true);
    try {
      // Remove undefined fields to avoid Firestore errors
      const payload: any = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined),
      );
      payload.creatorId = user?.uid;
      payload.addedAt = serverTimestamp();
      payload.addedBy = user?.email || "unknown";

      const docRef = await addDoc(collection(db, "inventory"), payload);
      // Add activity log entry
      await addDoc(collection(db, "activity"), {
        message: `Added inventory entry:\n  • Box Number: ${values.box_number}\n  • Type: ${values.type}\n  • Area Planted: ${values.area_planted}\n  • Year: ${values.year}\n  • Season: ${values.season}\n  • Storage Location: ${values.location}\n  • Description: ${values.description}\n  • Pedigree: ${values.pedigree}\n  • Weight: ${values.weight} kg\n  • Remarks: ${values.remarks}`,
        loggedAt: serverTimestamp(),
        loggedBy: user?.email || "unknown",
      });
      toast.success("Inventory added successfully!");
      // Call onAdd with the new item (with id)
      if (onAdd) {
        onAdd({ ...values, id: docRef.id });
      }
      // preserve box_number for next entry
      const savedBox = values.box_number;
      form.reset();
      form.setValue("box_number", savedBox);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Error adding inventory");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8 bg-white">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start"
        >
          <FormField
            control={form.control}
            name="box_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Box Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(
                        val === "" ? undefined : Math.max(0, Number(val)),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shelf_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shelf Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="area_planted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area Planted</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="A1 East" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={new Date().getFullYear().toString()}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="season"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Season</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-4"
                  >
                    {seasonOptions.map((option) => (
                      <FormItem
                        key={option}
                        className="flex items-center space-x-2"
                      >
                        <FormControl>
                          <RadioGroupItem value={option} />
                        </FormControl>
                        <FormLabel className="font-normal">{option}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {areaPlantedOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="inbred" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pedigree"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pedigree</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="PG 8 10-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(
                        val === "" ? undefined : Math.max(0, Number(val)),
                      );
                    }}
                  />
                </FormControl>
                <FormDescription>in kg</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-full flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
