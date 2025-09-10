import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ArchiveView() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    registryNumber: "",
    name: "",
    dateFrom: "",
    searchText: "",
    page: 1,
    limit: 10,
  });

  const { data: archiveData, isLoading } = useQuery({
    queryKey: ["/api/information-notes", searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/information-notes?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Arama başarısız");
      }
      
      return response.json();
    },
  });

  const handleSearch = () => {
    setSearchParams({ ...searchParams, page: 1 });
  };

  const downloadNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/generate-word/${noteId}`, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("İndirme hatası");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bilgi-notu-${noteId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "İndirme hatası",
        description: "Dosya indirilemedi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card data-testid="card-archive">
        <CardHeader>
          <CardTitle>Arşiv</CardTitle>
          <CardDescription>
            Geçmiş bilgi notlarını arayabilir ve inceleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registryNumber">Sicil Numarası</Label>
              <Input
                id="registryNumber"
                placeholder="Sicil No"
                value={searchParams.registryNumber}
                onChange={(e) => setSearchParams({ ...searchParams, registryNumber: e.target.value })}
                data-testid="input-registry-search"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">İsim</Label>
              <Input
                id="name"
                placeholder="İsim Soyisim"
                value={searchParams.name}
                onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
                data-testid="input-name-search"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Tarih</Label>
              <Input
                id="dateFrom"
                type="date"
                value={searchParams.dateFrom}
                onChange={(e) => setSearchParams({ ...searchParams, dateFrom: e.target.value })}
                data-testid="input-date-search"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchText">Metin Arama</Label>
              <div className="flex">
                <Input
                  id="searchText"
                  placeholder="Metin ara..."
                  value={searchParams.searchText}
                  onChange={(e) => setSearchParams({ ...searchParams, searchText: e.target.value })}
                  className="rounded-r-none"
                  data-testid="input-text-search"
                />
                <Button
                  onClick={handleSearch}
                  className="rounded-l-none"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Aranıyor...</div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table data-testid="table-archive-results">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Oluşturan</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archiveData?.notes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Hiç kayıt bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    archiveData?.notes?.map((note: any) => (
                      <TableRow key={note.id} data-testid={`row-note-${note.id}`}>
                        <TableCell>
                          {new Date(note.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>{note.user?.name}</TableCell>
                        <TableCell>{note.template?.name}</TableCell>
                        <TableCell>{note.subject}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement view modal
                                toast({
                                  title: "Görüntüleme",
                                  description: "Görüntüleme özelliği yakında eklenecek",
                                });
                              }}
                              data-testid={`button-view-${note.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadNote(note.id)}
                              data-testid={`button-download-${note.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {archiveData?.total > 0 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Toplam {archiveData.total} kayıt, sayfa {searchParams.page}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchParams({ ...searchParams, page: searchParams.page - 1 })}
                      disabled={searchParams.page === 1}
                      data-testid="button-prev-page"
                    >
                      Önceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchParams({ ...searchParams, page: searchParams.page + 1 })}
                      disabled={searchParams.page * searchParams.limit >= archiveData.total}
                      data-testid="button-next-page"
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
