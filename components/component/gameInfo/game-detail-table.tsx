import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";

export default function GameDetailTable(){
    return (
        <div className="mt-4">
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">1</TableCell>
                        <TableCell>Goal</TableCell>
                        <TableCell>Cristiano Ronaldo</TableCell>
                        <TableCell>10</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">2</TableCell>
                        <TableCell>Goal</TableCell>
                        <TableCell>Zlatan Ibrahimovic</TableCell>
                        <TableCell>25</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}